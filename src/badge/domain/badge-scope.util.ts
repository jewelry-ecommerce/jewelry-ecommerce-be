import { BADGE_FLOW_POLICY,BadgeRuleType,type BadgeFlowRow } from './badge-flow.schema';
export interface BadgeSku {id:number;productId:number;categoryId:number;stock:number;skuCode:string;collectionIds:number[]}
export function matchesBadgeScope(flow:BadgeFlowRow,sku:BadgeSku):boolean {
  const config=flow.ruleConfig;
  switch(flow.ruleType) {
    case BadgeRuleType.ALL:return true;
    case BadgeRuleType.OUT_OF_STOCK:return sku.stock<BADGE_FLOW_POLICY.outOfStockThreshold;
    case BadgeRuleType.CATEGORY:return [...(config.categoryIds??[]),...(config.categories??[]).map(category=>category.categoryId)].includes(sku.categoryId);
    case BadgeRuleType.COLLECTION:return [...(config.collectionIds??[]),...(config.collections??[]).map(collection=>collection.collectionId)].some(id=>sku.collectionIds.includes(id));
    case BadgeRuleType.MANUAL:return Boolean(config.targets?.some(target=>target.productVariantId===sku.id&&target.productId===sku.productId));
    default:return false;
  }
}
export function badgeFlowRunning(flow:BadgeFlowRow,now:number):boolean {
  return flow.status==='ACTIVE'&&(!flow.activeFrom||Date.parse(flow.activeFrom)<=now)&&(!flow.activeTo||Date.parse(flow.activeTo)>now);
}
