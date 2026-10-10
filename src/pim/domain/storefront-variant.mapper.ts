
import type { ProductAggregate,VariationRow,VariationValueRow } from './product.interface';
import { customerPrice } from './storefront-product.mapper';
export function storefrontVariant(aggregate:ProductAggregate,sku:VariationRow) {
  const stock=Math.max(0,sku.on_hand-sku.reserved);
  const medias=aggregate.media.filter(media=>media.variation_id===sku.id);
  const gallery=medias.map((media,index)=>({url:media.url,type:'IMAGE',sortOrder:media.sort_order,isPrimary:index===0}));
  const price=customerPrice(sku);
  return {id:sku.id,slug:aggregate.product.slug,name:aggregate.product.name,sku:sku.sku_code,
    stock,stockStatus:stock>0?'IN_STOCK':'OUT_OF_STOCK',isDefault:sku.id===aggregate.product.default_variation_id,
    purchaseAction:{code:stock>0?'ADD_TO_CART':'OUT_OF_STOCK',label:stock>0?'Thêm vào giỏ hàng':'Hết hàng',enabled:stock>0&&gallery.length>0},
    image:gallery[0]?.url??'',gallery,
    attributeValues:aggregate.values.filter(value=>value.variation_id===sku.id).map(variantAttributeValue),
    pricing:{currency:price.currency,sellingPriceAfterTaxMinor:price.sellingPriceAfterTaxMinor,
      compareAtPriceAfterTaxMinor:price.compareAtPriceAfterTaxMinor,discountPercent:price.discountPercent,customerDisplayPrice:price}};
}
function variantAttributeValue(value:VariationValueRow) {
  return {id:value.value_id,code:value.code,value:value.value,image:value.image,
    attribute:{id:value.attribute_id,name:value.attribute_name,code:value.attribute_code,index:value.attribute_index,displayType:value.display_type}};
}
export function storefrontSelectors(aggregate:ProductAggregate,variants:ReturnType<typeof storefrontVariant>[]) {
  const attributes=new Map<number,ReturnType<typeof variantAttributeValue>['attribute']>();
  for(const value of aggregate.values) attributes.set(value.attribute_id,variantAttributeValue(value).attribute);
  return [...attributes.values()].sort((left,right)=>left.index-right.index).map(attribute=>{
    const values=new Map<number,VariationValueRow>();
    for(const value of aggregate.values.filter(value=>value.attribute_id===attribute.id)) values.set(value.value_id,value);
    const options=[...values.values()].map(value=>{
      const matching=variants.filter(variant=>variant.attributeValues.some(selected=>selected.id===value.value_id));
      return {id:value.value_id,code:value.code,label:value.value,value:value.value,thumbnail:value.image,
        selected:matching.some(variant=>variant.isDefault),available:matching.some(variant=>variant.stock>0),
        variationIds:matching.map(variant=>variant.id)};
    });
    return {attribute,options};
  });
}
