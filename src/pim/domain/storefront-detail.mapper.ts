
import type { ProductAggregate } from './product.interface';
import { SkuStatus } from './catalog.enum';
import { storefrontVariant,storefrontSelectors } from './storefront-variant.mapper';
export function storefrontDetail(aggregate:ProductAggregate) {
  const {product,category}=aggregate;
  const variants=aggregate.skus.filter(sku=>sku.status===SkuStatus.ACTIVE).map(sku=>storefrontVariant(aggregate,sku));
  const defaultVariant=variants.find(variant=>variant.id===product.default_variation_id);
  if(!defaultVariant || !defaultVariant.gallery.length) return null;
  return {id:product.id,slug:product.slug,name:product.name,status:product.status,
    isPurchasable:defaultVariant.purchaseAction.enabled,sku:defaultVariant.sku,spuCode:product.spu_code,
    brand:{name:'',code:'',image:null,tenantCode:''},
    category:{id:category?.id??product.category_id,name:category?.name??'',slug:category?.slug??''},
    shortDescription:product.description??'',description:product.description??'',gallery:defaultVariant.gallery,
    seo:{metaTitle:typeof product.seo.title==='string'?product.seo.title:null,
      metaDescription:typeof product.seo.description==='string'?product.seo.description:null,
      metaKeywords:typeof product.seo.keywords==='string'?product.seo.keywords:null,image:defaultVariant.image},
    dimensions:{weight:product.metadata.weight??null,length:product.metadata.length??null,width:product.metadata.width??null,height:product.metadata.height??null},
    pricing:defaultVariant.pricing,availability:{inStock:defaultVariant.stock>0,stockStatus:defaultVariant.stockStatus},
    defaultVariant,defaultVariantId:defaultVariant.id,variantSelectors:storefrontSelectors(aggregate,variants),variants,
    productInfos:product.product_infos.map((info,index)=>({id:index,title:info.title??'',content:info.description,sortOrder:info.sortOrder})),
    createdAt:product.created_at.toISOString(),updatedAt:product.updated_at.toISOString()};
}
