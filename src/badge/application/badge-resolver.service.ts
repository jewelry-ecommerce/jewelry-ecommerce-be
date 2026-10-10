import { Injectable } from '@nestjs/common';
import { BadgeFlowService } from './badge-flow.service';
import { BadgeSkuRepository } from '../infrastructure/badge-sku.repository';
import { BADGE_FLOW_POLICY,BadgeChannel } from '../domain/badge-flow.schema';
import { badgeFlowRunning,matchesBadgeScope,type BadgeSku } from '../domain/badge-scope.util';
import { BadgePurpose,BadgeStatus } from '../domain/badge.enum';
type FlowView=Awaited<ReturnType<BadgeFlowService['detail']>>;
function badgePriority(purpose:BadgePurpose):number {
  return purpose===BadgePurpose.PRE_ORDER?BADGE_FLOW_POLICY.priority.PRE_ORDER:
    purpose===BadgePurpose.OUT_OF_STOCK?BADGE_FLOW_POLICY.priority.OUT_OF_STOCK:BADGE_FLOW_POLICY.priority.CAMPAIGN;
}
function resolveSku(sku:BadgeSku,flows:FlowView[],channel:BadgeChannel,now:number) {
  const candidates=flows.filter(flow=>badgeFlowRunning(flow,now)&&(flow.channel===BadgeChannel.ALL||flow.channel===channel)&&matchesBadgeScope(flow,sku))
    .flatMap(flow=>flow.rules.filter(rule=>rule.template?.status===BadgeStatus.ACTIVE).map(rule=>({...rule,flowId:flow.id})));
  candidates.sort((left,right)=>badgePriority(right.template!.badgeType)-badgePriority(left.template!.badgeType)||
    right.priorityWeight-left.priorityWeight||right.flowId-left.flowId);
  const winner=candidates[0],template=winner?.template;
  const badges=template?[{badgeTemplateId:template.id,code:template.code,name:template.name,type:template.type,position:template.defaultPosition,
    displayText:template.displayText??null,dynamicText:null,styleConfig:template.styleConfig??{},icon:template.icon??null,
    iconMobile:template.iconMobile??null,image:template.image??null,imageMobile:template.imageMobile??null,
    priorityWeight:winner.priorityWeight,isPinned:winner.isPinned}]:[];
  return {productId:sku.productId,productVariantId:sku.id,skuCode:sku.skuCode,badges};
}
@Injectable()
export class BadgeResolverService {
  constructor(private readonly flows:BadgeFlowService,private readonly skus:BadgeSkuRepository) {}
  async resolve(ids:number[],channel:BadgeChannel) {
    const [flows,skus]=await Promise.all([this.flows.views(),this.skus.published(ids)]);
    const now=Date.now();return skus.map(sku=>resolveSku(sku,flows,channel,now));
  }
}
