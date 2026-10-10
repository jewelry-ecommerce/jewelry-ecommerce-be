import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { BadgeSku } from '../domain/badge-scope.util';
@Injectable()
export class BadgeSkuRepository {
  constructor(private readonly source:DataSource) {}
  async published(ids?:number[]):Promise<BadgeSku[]> {
    return this.source.query(`SELECT sku.id,sku.product_id AS "productId",product.category_id AS "categoryId",sku.sku_code AS "skuCode",
      GREATEST(0,sku.on_hand-sku.reserved) AS stock,
      ARRAY(SELECT membership.collection_id FROM product_collections membership JOIN collections collection ON collection.id=membership.collection_id
        WHERE membership.product_id=product.id AND membership.deleted_at IS NULL AND collection.deleted_at IS NULL AND collection.status='ACTIVE') AS "collectionIds"
      FROM product_variations sku JOIN products product ON product.id=sku.product_id
      JOIN categories category ON category.id=product.category_id AND category.deleted_at IS NULL AND category.status='ACTIVE'
      WHERE sku.deleted_at IS NULL AND sku.status='ACTIVE' AND product.deleted_at IS NULL AND product.status='PUBLISHED'
      AND ($1::int[] IS NULL OR sku.id=ANY($1::int[]))`,[ids??null]);
  }
}
