
export interface StorefrontProductQuery {page?:number;take?:number;search?:string;productIds?:number[];collectionSlug?:string;categorySlug?:string}
export interface CustomerPrice {currency:'VND';sellingPriceAfterTaxMinor:number;compareAtPriceAfterTaxMinor:number|null;discountPercent:number|null;hasDiscount:boolean}
export interface PublicSku {id:number;skuCode:string;image:string|null;imageHover:string|null;stockStatus:string;customerDisplayPrice:CustomerPrice}
export interface ProductCard {productId:number;name:string;slug:string;status:string;isPurchasable:boolean;brandName:null;
  selectedSku:PublicSku;visualSwitch:null;addToCart:{mode:'DIRECT'|'SELECT_REQUIRED'};updatedAt:string}
export const STOREFRONT_PRODUCT_POLICY={currency:'VND',discountPercentageScale:100} as const;
