
import type { ProductAggregate,VariationRow } from './product.interface';
import { ProductStatus,SkuStatus } from './catalog.enum';
import { STOREFRONT_PRODUCT_POLICY,type ProductCard,type CustomerPrice } from './storefront-product.interface';
export function customerPrice(sku:VariationRow):CustomerPrice {
  const selling=Number(sku.selling_price_minor),compare=sku.compare_at_price_minor===null?null:Number(sku.compare_at_price_minor);
  const hasDiscount=compare!==null&&compare>selling;
  return {currency:STOREFRONT_PRODUCT_POLICY.currency,sellingPriceAfterTaxMinor:selling,
    compareAtPriceAfterTaxMinor:hasDiscount?compare:null,hasDiscount,
    discountPercent:hasDiscount?Math.round((compare-selling)/compare*STOREFRONT_PRODUCT_POLICY.discountPercentageScale):null};
}
export function storefrontCard(aggregate:ProductAggregate):ProductCard|null {
  const {product,skus,media}=aggregate;
  if(product.status!==ProductStatus.PUBLISHED) return null;
  const representative=skus.find(sku=>sku.id===product.default_variation_id&&sku.status===SkuStatus.ACTIVE);
  if(!representative) return null;
  const images=media.filter(image=>image.variation_id===representative.id);
  if(!images.length) return null;
  const stock=Math.max(representative.on_hand-representative.reserved,0);
  return {productId:product.id,name:product.name,slug:product.slug,status:product.status,
    isPurchasable:stock>0,brandName:null,visualSwitch:null,updatedAt:product.updated_at.toISOString(),
    selectedSku:{id:representative.id,skuCode:representative.sku_code,image:images[0]?.url??null,
      imageHover:images[1]?.url??null,stockStatus:stock>0?'IN_STOCK':'OUT_OF_STOCK',customerDisplayPrice:customerPrice(representative)},
    addToCart:{mode:skus.filter(sku=>sku.status===SkuStatus.ACTIVE).length>1?'SELECT_REQUIRED':'DIRECT'}};
}
