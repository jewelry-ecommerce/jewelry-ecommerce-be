import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import type { CatalogInput, CatalogRecord, CatalogResource, CatalogWriteInput, AttributeValueRecord } from '../domain/catalog.interface';
import { CATALOG_AUDIT_SELECT, CATALOG_COLUMNS, CATALOG_SELECT } from './catalog.columns';
import type { CatalogDependency } from '../domain/catalog-dependency.interface';
@Injectable()
export class CatalogRepository {
  constructor(private readonly source: DataSource) {}
  async list(resource: CatalogResource): Promise<CatalogRecord[]> {
    return this.source.query<CatalogRecord[]>(`SELECT ${CATALOG_SELECT[resource]},${CATALOG_AUDIT_SELECT} FROM ${resource} WHERE deleted_at IS NULL ORDER BY id DESC`);
  }
  async write(resource: CatalogResource, input: CatalogWriteInput, id?: number): Promise<number> {
    return this.source.transaction(async manager => {
      const savedId = await this.save(manager, resource, input, id);
      await this.saveRelations(manager, resource, savedId, input);
      return savedId;
    });
  }
  async dependencies(resource:CatalogResource,id:number):Promise<CatalogDependency[]> {
    if(resource==='categories') {
      const products=await this.source.query<{id:number;name:string}[]>('SELECT id,name FROM products WHERE category_id=$1 AND deleted_at IS NULL',[id]);
      const children=await this.source.query<{id:number;name:string}[]>('SELECT id,name FROM categories WHERE parent_id=$1 AND deleted_at IS NULL',[id]);
      return [...products.map(product=>({module:'PIM' as const,entityType:'PRODUCT' as const,entityId:product.id,name:product.name})),
        ...children.map(category=>({module:'PIM' as const,entityType:'CATEGORY' as const,entityId:category.id,name:category.name}))];
    }
    if(resource==='attributes') {
      const products=await this.source.query<{id:number;name:string}[]>('SELECT DISTINCT p.id,p.name FROM products p JOIN product_attributes pa ON pa.product_id=p.id WHERE pa.attribute_id=$1 AND p.deleted_at IS NULL',[id]);
      const categories=await this.source.query<{id:number;name:string}[]>('SELECT DISTINCT c.id,c.name FROM categories c JOIN category_attributes ca ON ca.category_id=c.id WHERE ca.attribute_id=$1 AND c.deleted_at IS NULL',[id]);
      return [...products.map(product=>({module:'PIM' as const,entityType:'PRODUCT' as const,entityId:product.id,name:product.name})),
        ...categories.map(category=>({module:'PIM' as const,entityType:'CATEGORY' as const,entityId:category.id,name:category.name}))];
    }
    const collection=(await this.list('collections')).find(record=>record.id===id);
    const pages=await this.source.query<{id:number;name:string}[]>(`SELECT DISTINCT p.id,p.name FROM cms_pages p JOIN cms_blocks b ON b.page_id=p.id WHERE p.deleted_at IS NULL AND (b.config->'dataSource'->>'collectionSlug'=$1 OR b.config->>'collectionSlug'=$1 )`,[collection?.slug]);
    return pages.map(page=>({module:'CMS',entityType:'PAGE',entityId:page.id,name:page.name}));
  }
  async delete(resource: CatalogResource, id: number): Promise<void> {
    await this.source.query(`UPDATE ${resource} SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, [id]);
  }
  async values(attributeId: number): Promise<AttributeValueRecord[]> {
    return this.attributeValues(attributeId);
  }
  async omittedValueDependencies(attributeId:number,codes:string[]):Promise<CatalogDependency[]> {
    const products=await this.source.query<{id:number;name:string}[]>(`
      SELECT DISTINCT p.id,p.name FROM products p JOIN product_variations pv ON pv.product_id=p.id
      JOIN variation_values vv ON vv.variation_id=pv.id JOIN attribute_values av ON av.id=vv.value_id
      WHERE av.attribute_id=$1 AND NOT(av.code=ANY($2::varchar[])) AND p.deleted_at IS NULL AND pv.deleted_at IS NULL
    `,[attributeId,codes]);
    return products.map(product=>({module:'PIM',entityType:'PRODUCT',entityId:product.id,name:product.name}));
  }
  async collectionItems(collectionId:number):Promise<{id:number;collectionId:number;productId:number;order:number;createdAt:Date;updatedAt:Date}[]> {
    return this.source.query('SELECT id,collection_id AS "collectionId",product_id AS "productId",sort_order AS "order",created_at AS "createdAt",updated_at AS "updatedAt" FROM product_collections WHERE collection_id=$1 AND deleted_at IS NULL ORDER BY sort_order,id',[collectionId]);
  }
  private async attributeValues(attributeId: number): Promise<AttributeValueRecord[]> {
    return this.source.query<AttributeValueRecord[]>('SELECT id,attribute_id AS "attributeId",code,value,image FROM attribute_values WHERE attribute_id=$1 AND deleted_at IS NULL ORDER BY sort_order,id', [attributeId]);
  }
  async relationIds(resource: CatalogResource, id: number): Promise<number[]> {
    if (resource === 'attributes') return [];
    const sql = resource === 'categories'
      ? 'SELECT attribute_id AS id FROM category_attributes WHERE category_id=$1 AND deleted_at IS NULL ORDER BY sort_order,id'
      : 'SELECT product_id AS id FROM product_collections WHERE collection_id=$1 AND deleted_at IS NULL ORDER BY sort_order,id';
    const rows = await this.source.query<{ id: number }[]>(sql, [id]);
    return rows.map(row => row.id);
  }
  private async save(manager: EntityManager, resource: CatalogResource, input: CatalogInput, id?: number): Promise<number> {
    const entries = Object.entries(CATALOG_COLUMNS[resource]).filter(([key]) => input[key as keyof CatalogInput] !== undefined);
    const values: unknown[] = entries.map(([key]) => input[key as keyof CatalogInput]);
    if (resource === 'categories') {
      entries.push(['seo', 'seo']);
      values.push({ title: input.metaTitle ?? null, description: input.metaDescription ?? null, keywords: input.metaKeywords ?? null });
    }
    const columns = entries.map(([, column]) => column);
    const placeholders = values.map((_, index) => '$' + (index + 1));
    const sql = id === undefined
      ? `INSERT INTO ${resource}(${columns.join(',')}) VALUES(${placeholders.join(',')}) RETURNING id`
      : `WITH updated AS (UPDATE ${resource} SET ${columns.map((column,index) => column+'='+placeholders[index]).join(',')},updated_at=now() WHERE id=$${values.length+1} AND deleted_at IS NULL RETURNING id) SELECT id FROM updated`;
    if (id !== undefined) values.push(id);
    const rows = await manager.query<{ id: number }[]>(sql, values);
    if (!rows[0]) throw new Error('Catalog write returned no record');
    return rows[0].id;
  }
  private async saveRelations(manager: EntityManager, resource: CatalogResource, id: number, input: CatalogWriteInput): Promise<void> {
    if (resource === 'attributes' && input.values) await this.replaceValues(manager, id, input.values);
    const ids = resource === 'categories' ? input.directAttributeIds : resource === 'collections' ? input.productIds : undefined;
    if (ids === undefined) return;
    const table = resource === 'categories' ? 'category_attributes' : 'product_collections';
    const owner = resource === 'categories' ? 'category_id' : 'collection_id';
    const target = resource === 'categories' ? 'attribute_id' : 'product_id';
    await manager.query(`DELETE FROM ${table} WHERE ${owner}=$1`, [id]);
    for (const [order,targetId] of [...new Set(ids)].entries()) {
      await manager.query(`INSERT INTO ${table}(${owner},${target},sort_order) VALUES($1,$2,$3)`, [id,targetId,order]);
    }
  }
  private async replaceValues(manager: EntityManager, attributeId: number, values: NonNullable<CatalogWriteInput['values']>): Promise<void> {
    const codes = values.map(value => value.code.trim());
    await manager.query('UPDATE attribute_values SET deleted_at=now(),updated_at=now() WHERE attribute_id=$1 AND NOT(code=ANY($2::varchar[]))', [attributeId,codes]);
    for (const [index,value] of values.entries()) {
      await manager.query('INSERT INTO attribute_values(attribute_id,code,value,image,sort_order) VALUES($1,$2,$3,$4,$5) ON CONFLICT(attribute_id,code) DO UPDATE SET value=EXCLUDED.value,image=EXCLUDED.image,sort_order=EXCLUDED.sort_order,deleted_at=NULL,updated_at=now()',
        [attributeId,value.code.trim(),value.value.trim(),value.image ?? null,index]);
    }
  }
}
