import type { ProductAggregate, ProductView, VariationRow } from './product.interface';
import { ProductStatus, SkuStatus } from './catalog.enum';
import { skuTaxPricing } from './product-pricing.util';
export function productView(aggregate: ProductAggregate): ProductView {
  const { product,skus,media } = aggregate;
  const representative = skus.find(sku => sku.id === product.default_variation_id && sku.status === SkuStatus.ACTIVE);
  const representativeMedia = representative ? media.filter(image => image.variation_id === representative.id) : [];
  return {
    id: product.id,spuCode: product.spu_code,name: product.name,slug: product.slug,status: product.status,
    categoryId: product.category_id,defaultVariationId: product.default_variation_id,description: product.description,
    category:aggregate.category,productKind:product.product_kind,unitOfMeasure:product.unit_of_measure,
    taxRateOverride:product.tax_rate_override===null?null:Number(product.tax_rate_override),...product.metadata,
    metaTitle:product.seo.title??null,metaDescription:product.seo.description??null,metaKeywords:product.seo.keywords??null,
    image: representativeMedia[0]?.url ?? null,imageHover: representativeMedia[1]?.url ?? null,
    gallery: representativeMedia.map(image => image.url),seo: product.seo,productInfos:product.product_infos,
    createdAt: product.created_at.toISOString(),updatedAt: product.updated_at.toISOString(),
    isPurchasable: product.status === ProductStatus.PUBLISHED && Boolean(representativeMedia.length),
    variations: skus.map(sku => variationView(aggregate,sku)),
  };
}
function variationView(aggregate:ProductAggregate,sku:VariationRow): Record<string,unknown> {
  const values = aggregate.values.filter(value => value.variation_id === sku.id);
  const images = aggregate.media.filter(image => image.variation_id === sku.id);
  const medias = images.map(image => ({id:image.id,productVariationId:sku.id,url:image.url,sortOrder:image.sort_order}));
  const price = Number(sku.selling_price_minor),compare = sku.compare_at_price_minor === null ? null : Number(sku.compare_at_price_minor);
  const stock = Math.max(0,sku.on_hand-sku.reserved);
  return {
    id:sku.id,productId:sku.product_id,skuCode:sku.sku_code,sku:sku.sku_code,status:sku.status,
    isDefault:aggregate.product.default_variation_id === sku.id,medias,image:images[0]?.url ?? null,imageHover:images[1]?.url ?? null,
    slug:aggregate.product.slug,name:aggregate.product.name,price:String(price),salePrice:null,
    attributeValueIds:values.map(value => value.value_id),stock,stockStatus:stock>0?'IN_STOCK':'OUT_OF_STOCK',
    sellingPriceAfterTaxMinor:price,compareAtPriceAfterTaxMinor:compare,
    costPriceAfterTaxMinor:sku.cost_price_minor === null?null:Number(sku.cost_price_minor),
    ...skuTaxPricing(aggregate,sku),weight:sku.weight===null?null:Number(sku.weight),
    length:sku.length===null?null:Number(sku.length),width:sku.width===null?null:Number(sku.width),height:sku.height===null?null:Number(sku.height),
    onHand:sku.on_hand,reserved:sku.reserved,attributeValues:values.map(value => ({
      id:value.value_id,code:value.code,value:value.value,image:value.image,
      attribute:{id:value.attribute_id,name:value.attribute_name,code:value.attribute_code,displayType:value.display_type},
    })),
    pricing:{sellingPriceAfterTaxMinor:price,compareAtPriceAfterTaxMinor:compare},
  };
}
