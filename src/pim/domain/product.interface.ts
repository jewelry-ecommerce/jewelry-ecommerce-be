import type { ProductStatus, SkuStatus } from './catalog.enum';
import type { ProductUnitOfMeasure, ProductMetadata, SkuMetadata, CategorySummary } from './product-presentation.interface';
export interface ProductAttributeInput { attributeId: number; valueIds: number[] }
export interface ProductSkuInput {
  id?:number;
  taxRateOverride?:number|null;b2bWholesalePriceAfterTax?:number|null;
  skuCode: string; status: SkuStatus; attributeValueIds: number[]; medias: string[];
  sellingPriceAfterTaxMinor: number; compareAtPriceAfterTaxMinor?: number | null;
  costPriceAfterTaxMinor?: number | null; onHand?: number; weight?: number; length?: number; width?: number; height?: number;
}
export interface ProductWriteInput {
  unitOfMeasure?:ProductUnitOfMeasure;taxRateOverride?:number|null;weight?:number;length?:number;width?:number;height?:number;productMixMatch?:number[];
  spuCode: string; name: string; categoryId: number; slug?: string; description?: string;
  defaultSkuCode: string; attributes: ProductAttributeInput[]; skus: ProductSkuInput[];
  productInfos?: { title?: string; description: string; sortOrder: number }[];
  metaTitle?: string; metaDescription?: string; metaKeywords?: string;
}
export interface ProductRow {
  product_kind:string;unit_of_measure:ProductUnitOfMeasure;metadata:ProductMetadata;tax_rate_override:string|null;
  id: number; category_id: number; spu_code: string; name: string; slug: string; status: ProductStatus;
  default_variation_id: number | null; description: string | null; product_infos: {title?:string;description:string;sortOrder:number}[]; seo: Record<string, unknown>;
  published_at: Date | null; created_at: Date; updated_at: Date;
}
export interface VariationRow {
  metadata:SkuMetadata;
  id: number; product_id: number; sku_code: string; status: SkuStatus; selling_price_minor: string;
  compare_at_price_minor: string | null; cost_price_minor: string | null; on_hand: number; reserved: number;
  weight: string | null; length: string | null; width: string | null; height: string | null;
}
export interface VariationValueRow { variation_id: number; attribute_id: number; attribute_index: number; value_id: number; value: string; code: string; attribute_name: string; attribute_code: string; display_type: string; image: string | null }
export interface VariationMediaRow { id: number; variation_id: number; url: string; sort_order: number }
export interface ProductAggregate { product: ProductRow; skus: VariationRow[]; values: VariationValueRow[]; media: VariationMediaRow[];category?:CategorySummary }
export interface ProductView extends Record<string, unknown> { id: number; spuCode: string; name: string; slug: string; status: ProductStatus; variations: Record<string, unknown>[] }
