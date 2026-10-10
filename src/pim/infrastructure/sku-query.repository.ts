import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SkuOrderDirection,SkuOrderField,type SkuQuery,type SkuPickerRow } from '../domain/sku-query.interface';
const SKU_SCOPE_SQL=`FROM product_variations sku JOIN products product ON product.id=sku.product_id
 WHERE sku.deleted_at IS NULL AND product.deleted_at IS NULL
 AND ($1::text IS NULL OR sku.sku_code ILIKE '%'||$1||'%' OR product.name ILIKE '%'||$1||'%')
 AND ($2::int[] IS NULL OR product.category_id=ANY($2::int[]))
 AND ($3::int[] IS NULL OR EXISTS(SELECT 1 FROM product_collections membership
 JOIN collections collection ON collection.id=membership.collection_id AND collection.deleted_at IS NULL
 WHERE membership.product_id=product.id AND membership.deleted_at IS NULL AND membership.collection_id=ANY($3::int[])))`;
@Injectable()
export class SkuQueryRepository {
  constructor(private readonly source:DataSource) {}
  async list(query:SkuQuery,page:number,take:number):Promise<{total:number;list:SkuPickerRow[]}> {
    const params=[query.search?.trim()||null,query.categoryIds??null,query.collectionIds??null];
    const column=query.orderBy===SkuOrderField.SKU_CODE?'sku.sku_code':'sku.updated_at';
    const direction=query.orderType===SkuOrderDirection.ASC?'ASC':'DESC';
    return this.source.transaction('REPEATABLE READ',async manager=>{
      const counts=await manager.query<{total:number}[]>(`SELECT COUNT(*)::int AS total ${SKU_SCOPE_SQL}`,params);
      const list=await manager.query<SkuPickerRow[]>(`SELECT sku.id,sku.sku_code AS "skuCode",product.name,product.slug,
        GREATEST(sku.on_hand-sku.reserved,0) AS stock,
        (SELECT media.url FROM variation_media media WHERE media.variation_id=sku.id AND media.deleted_at IS NULL
          ORDER BY media.sort_order,media.id LIMIT 1) AS image,
        jsonb_build_object('id',product.id,'name',product.name) AS product,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('url',media.url) ORDER BY media.sort_order,media.id)
          FROM variation_media media WHERE media.variation_id=sku.id AND media.deleted_at IS NULL),'[]'::jsonb) AS medias
        ${SKU_SCOPE_SQL} ORDER BY ${column} ${direction},sku.id ${direction} LIMIT $4 OFFSET $5`,
        [...params,take,(page-1)*take]);
      return {total:counts[0]!.total,list};
    });
  }
}
