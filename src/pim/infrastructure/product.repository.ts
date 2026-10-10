import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import type { ProductAggregate, ProductRow, ProductWriteInput, VariationRow, VariationValueRow, VariationMediaRow, ProductSkuInput } from '../domain/product.interface';
import { ProductStatus } from '../domain/catalog.enum';
import type { StorefrontProductQuery } from '../domain/storefront-product.interface';
import { ProductUnitOfMeasure, type CategorySummary } from '../domain/product-presentation.interface';
@Injectable()
export class ProductRepository {
  constructor(private readonly source: DataSource) {}
  async publishedIdBySlug(slug:string):Promise<number|undefined> {
    const rows=await this.source.query<{id:number}[]>(`SELECT product.id FROM products product
      JOIN categories category ON category.id=product.category_id AND category.deleted_at IS NULL AND category.status='ACTIVE'
      WHERE product.slug=$1 AND product.deleted_at IS NULL AND product.status='PUBLISHED'`,[slug]);
    return rows[0]?.id;
  }
  async storefrontRows(query:StorefrontProductQuery):Promise<ProductRow[]> {
    return this.source.query<ProductRow[]>(`SELECT p.* FROM products p
      JOIN categories category ON category.id=p.category_id AND category.deleted_at IS NULL AND category.status='ACTIVE'
      JOIN product_variations sku ON sku.id=p.default_variation_id AND sku.product_id=p.id AND sku.deleted_at IS NULL AND sku.status='ACTIVE'
      WHERE p.deleted_at IS NULL AND p.status='PUBLISHED'
      AND EXISTS(SELECT 1 FROM variation_media media WHERE media.variation_id=sku.id AND media.deleted_at IS NULL)
      AND ($1::text IS NULL OR p.name ILIKE '%'||$1||'%' OR p.spu_code ILIKE '%'||$1||'%')
      AND ($2::int[] IS NULL OR p.id=ANY($2::int[]))
      AND ($3::text IS NULL OR EXISTS(SELECT 1 FROM product_collections membership JOIN collections collection ON collection.id=membership.collection_id
        WHERE membership.product_id=p.id AND membership.deleted_at IS NULL AND collection.deleted_at IS NULL AND collection.status='ACTIVE' AND collection.slug=$3))
      AND ($4::text IS NULL OR category.slug=$4) ORDER BY p.updated_at DESC,p.id DESC`,
      [query.search?.trim()||null,query.productIds??null,query.collectionSlug??null,query.categorySlug??null]);
  }
  async list(): Promise<ProductRow[]> {
    return this.source.query<ProductRow[]>('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY id DESC');
  }
  async aggregate(id: number): Promise<ProductAggregate | null> {
    const products = await this.source.query<ProductRow[]>('SELECT * FROM products WHERE id=$1 AND deleted_at IS NULL',[id]);
    if (!products[0]) return null;
    const skus = await this.source.query<VariationRow[]>('SELECT * FROM product_variations WHERE product_id=$1 AND deleted_at IS NULL ORDER BY id',[id]);
    const ids = skus.map(sku => sku.id);
    const values = await this.source.query<VariationValueRow[]>('SELECT vv.variation_id,vv.attribute_id,pa.sort_order AS attribute_index,vv.value_id,v.value,v.code,a.name AS attribute_name,a.code AS attribute_code,a.display_type,v.image FROM variation_values vv JOIN attribute_values v ON v.id=vv.value_id JOIN attributes a ON a.id=vv.attribute_id JOIN product_variations sku ON sku.id=vv.variation_id JOIN product_attributes pa ON pa.product_id=sku.product_id AND pa.attribute_id=vv.attribute_id WHERE vv.variation_id=ANY($1::int[]) AND vv.deleted_at IS NULL',[ids]);
    const media = await this.source.query<VariationMediaRow[]>('SELECT id,variation_id,url,sort_order FROM variation_media WHERE variation_id=ANY($1::int[]) AND deleted_at IS NULL ORDER BY sort_order,id',[ids]);
    const category=await this.category(products[0].category_id);
    return { product: products[0],skus,values,media,category };
  }
  async create(input: ProductWriteInput, slug: string): Promise<number> {
    return this.source.transaction(async manager => {
      await this.validateReferences(manager,input);
      const records = await manager.query<{id:number}[]>('INSERT INTO products(category_id,spu_code,slug,name,description,product_infos,seo) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [input.categoryId,input.spuCode.trim(),slug,input.name.trim(),input.description ?? null,JSON.stringify(input.productInfos ?? []),{title:input.metaTitle,description:input.metaDescription,keywords:input.metaKeywords}]);
      const productId = records[0]!.id;
      await this.savePresentation(manager,productId,input);
      await this.linkAttributes(manager,productId,input);
      for (const sku of input.skus) {
        const variationId = await this.insertSku(manager,productId,sku);
        if (sku.skuCode.trim().toUpperCase() === input.defaultSkuCode.trim().toUpperCase()) {
          await manager.query('UPDATE products SET default_variation_id=$1 WHERE id=$2',[variationId,productId]);
        }
      }
      return productId;
    });
  }
  async update(id:number,input:ProductWriteInput,slug:string):Promise<void> {
    await this.source.transaction(async manager=>{
      const locked=await manager.query<ProductRow[]>('SELECT * FROM products WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[id]);
      if(!locked[0]) throw new Error('PRODUCT_NOT_FOUND');
      await this.validateReferences(manager,input);
      await manager.query('UPDATE products SET category_id=$1,spu_code=$2,slug=$3,name=$4,description=$5,product_infos=$6,seo=$7,updated_at=now() WHERE id=$8',
        [input.categoryId,input.spuCode.trim(),slug,input.name.trim(),input.description??null,JSON.stringify(input.productInfos??[]),
          {title:input.metaTitle,description:input.metaDescription,keywords:input.metaKeywords},id]);
      await manager.query('DELETE FROM product_attribute_values WHERE product_id=$1',[id]);
      await manager.query('DELETE FROM product_attributes WHERE product_id=$1',[id]);
      await this.linkAttributes(manager,id,input);
      await this.savePresentation(manager,id,input);
      await this.replaceSkus(manager,id,input);
    });
  }
  private async replaceSkus(manager:EntityManager,productId:number,input:ProductWriteInput):Promise<void> {
    const existing=await manager.query<VariationRow[]>('SELECT * FROM product_variations WHERE product_id=$1 AND deleted_at IS NULL FOR UPDATE',[productId]);
    const keep:number[]=[];
    for(const sku of input.skus) {
      const previous=sku.id===undefined?existing.find(row=>row.sku_code.toUpperCase()===sku.skuCode.trim().toUpperCase())
        :existing.find(row=>row.id===sku.id);
      if(sku.id!==undefined && !previous) throw new Error('PRODUCT_SKU_NOT_OWNED');
      const id=previous?await this.updateSku(manager,previous,sku):await this.insertSku(manager,productId,sku);
      keep.push(id);
      if(sku.skuCode.trim().toUpperCase()===input.defaultSkuCode.trim().toUpperCase()) {
        await manager.query('UPDATE products SET default_variation_id=$1 WHERE id=$2',[id,productId]);
      }
    }
    await manager.query('UPDATE product_variations SET deleted_at=now(),status=$1,updated_at=now() WHERE product_id=$2 AND NOT(id=ANY($3::int[])) AND deleted_at IS NULL',['INACTIVE',productId,keep]);
  }
  private async updateSku(manager:EntityManager,previous:VariationRow,sku:ProductSkuInput):Promise<number> {
    if(sku.onHand!==undefined && sku.onHand<previous.reserved) throw new Error('PRODUCT_SKU_RESERVED_STOCK');
    await manager.query('UPDATE product_variations SET sku_code=$1,status=$2,selling_price_minor=$3,compare_at_price_minor=$4,cost_price_minor=$5,on_hand=COALESCE($6,on_hand),weight=$7,length=$8,width=$9,height=$10,updated_at=now() WHERE id=$11',
      [sku.skuCode.trim(),sku.status,sku.sellingPriceAfterTaxMinor,sku.compareAtPriceAfterTaxMinor??null,sku.costPriceAfterTaxMinor??null,
        sku.onHand??null,sku.weight??null,sku.length??null,sku.width??null,sku.height??null,previous.id]);
    await manager.query('DELETE FROM variation_values WHERE variation_id=$1',[previous.id]);
    await this.linkSkuValues(manager,previous.id,sku.attributeValueIds);
    await manager.query('UPDATE product_variations SET metadata=$1 WHERE id=$2',[{taxRateOverride:sku.taxRateOverride??null,b2bWholesalePriceAfterTax:sku.b2bWholesalePriceAfterTax??null},previous.id]);
    await manager.query('DELETE FROM variation_media WHERE variation_id=$1 AND sort_order >= $2',[previous.id,sku.medias.length]);
    for(const [index,url] of sku.medias.entries()) {
      await manager.query('INSERT INTO variation_media(variation_id,url,sort_order) VALUES($1,$2,$3) ON CONFLICT(variation_id,sort_order) DO UPDATE SET url=EXCLUDED.url,updated_at=now(),deleted_at=NULL',
        [previous.id,url,index]);
    }
    return previous.id;
  }
  async setStatus(id: number,status: ProductStatus): Promise<void> {
    await this.source.query('UPDATE products SET status=$1::varchar,published_at=CASE WHEN $1::varchar=$2::varchar THEN now() ELSE published_at END,updated_at=now() WHERE id=$3 AND deleted_at IS NULL',[status,ProductStatus.PUBLISHED,id]);
  }
  private async category(id:number):Promise<CategorySummary|undefined> {
    const records=await this.source.query<CategorySummary[]>(`
      WITH RECURSIVE ancestors AS (
        SELECT id,parent_id FROM categories WHERE id=$1
        UNION SELECT parent.id,parent.parent_id FROM categories parent JOIN ancestors child ON child.parent_id=parent.id
      )
      SELECT id,name,code,slug,status,parent_id AS "parentId",tax_rate::float AS "taxRate",
        (SELECT count(*)::int FROM ancestors) AS level FROM categories WHERE id=$1 AND deleted_at IS NULL
    `,[id]);
    return records[0];
  }
  private async savePresentation(manager:EntityManager,id:number,input:ProductWriteInput):Promise<void> {
    await manager.query('UPDATE products SET unit_of_measure=$1,tax_rate_override=$2,metadata=$3 WHERE id=$4',
      [input.unitOfMeasure??ProductUnitOfMeasure.EACH,input.taxRateOverride??null,
        {weight:input.weight,length:input.length,width:input.width,height:input.height,productMixMatch:input.productMixMatch??[]},id]);
  }
  private async validateReferences(manager: EntityManager,input: ProductWriteInput): Promise<void> {
    const categories = await manager.query<{id:number}[]>('SELECT id FROM categories WHERE id=$1 AND deleted_at IS NULL AND status=$2',[input.categoryId,'ACTIVE']);
    if (!categories[0]) throw new Error('PRODUCT_CATEGORY_NOT_FOUND');
    for (const attribute of input.attributes) {
      const records = await manager.query<{id:number}[]>('SELECT id FROM attribute_values WHERE attribute_id=$1 AND id=ANY($2::int[]) AND deleted_at IS NULL',[attribute.attributeId,attribute.valueIds]);
      if (records.length !== new Set(attribute.valueIds).size) throw new Error('PRODUCT_ATTRIBUTE_VALUE_NOT_FOUND');
    }
  }
  private async linkAttributes(manager: EntityManager,productId:number,input:ProductWriteInput): Promise<void> {
    for (const [index,attribute] of input.attributes.entries()) {
      await manager.query('INSERT INTO product_attributes(product_id,attribute_id,sort_order) VALUES($1,$2,$3)',[productId,attribute.attributeId,index]);
      for (const valueId of attribute.valueIds) {
        await manager.query('INSERT INTO product_attribute_values(product_id,attribute_id,value_id) VALUES($1,$2,$3)',[productId,attribute.attributeId,valueId]);
      }
    }
  }
  private async insertSku(manager:EntityManager,productId:number,sku:ProductSkuInput): Promise<number> {
    const records = await manager.query<{id:number}[]>('INSERT INTO product_variations(product_id,sku_code,status,selling_price_minor,compare_at_price_minor,cost_price_minor,on_hand,weight,length,width,height) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [productId,sku.skuCode.trim(),sku.status,sku.sellingPriceAfterTaxMinor,sku.compareAtPriceAfterTaxMinor ?? null,sku.costPriceAfterTaxMinor ?? null,sku.onHand ?? 0,sku.weight ?? null,sku.length ?? null,sku.width ?? null,sku.height ?? null]);
    const id = records[0]!.id;
    await manager.query('UPDATE product_variations SET metadata=$1 WHERE id=$2',[{taxRateOverride:sku.taxRateOverride??null,b2bWholesalePriceAfterTax:sku.b2bWholesalePriceAfterTax??null},id]);
    await this.linkSkuValues(manager,id,sku.attributeValueIds);
    for (const [index,url] of sku.medias.entries()) {
      await manager.query('INSERT INTO variation_media(variation_id,url,sort_order) VALUES($1,$2,$3)',[id,url,index]);
    }
    return id;
  }
  private async linkSkuValues(manager:EntityManager,variationId:number,values:number[]): Promise<void> {
    for (const valueId of values) {
      await manager.query('INSERT INTO variation_values(variation_id,attribute_id,value_id) SELECT $1,attribute_id,id FROM attribute_values WHERE id=$2 AND deleted_at IS NULL',[variationId,valueId]);
    }
  }
}
