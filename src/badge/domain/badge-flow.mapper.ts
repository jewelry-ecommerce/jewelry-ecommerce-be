import { BadgePosition } from './badge.enum';
import type { BadgeTemplateView } from './badge.schema';
import type { BadgeFlowLink,BadgeFlowRow } from './badge-flow.schema';
import { badgeFlowRunning,matchesBadgeScope,type BadgeSku } from './badge-scope.util';
export function badgeFlowView(flow:BadgeFlowRow,links:BadgeFlowLink[],templates:BadgeTemplateView[],skus:BadgeSku[]) {
  const rules=links.filter(link=>link.flowId===flow.id).map(link=>{
    const template=templates.find(template=>template.id===link.badgeTemplateId)??null;
    return {...link,name:template?.name??'',template,badgeTemplate:template,isActive:flow.status==='ACTIVE',ruleType:flow.ruleType,
      ruleConfig:flow.ruleConfig,channel:flow.channel,isSystem:false,assignments:[]};
  });
  const displayStatus=flow.status==='DRAFT'?'DRAFT':flow.activeTo&&Date.parse(flow.activeTo)<=Date.now()?'ENDED':
    flow.status==='INACTIVE'?'PAUSED':flow.activeFrom&&Date.parse(flow.activeFrom)>Date.now()?'SCHEDULED':'RUNNING';
  return {...flow,rules,templates:links.filter(link=>link.flowId===flow.id).map(link=>({
    badgeTemplateId:link.badgeTemplateId,priorityWeight:link.priorityWeight,isPinned:link.isPinned})),
    isActive:flow.status==='ACTIVE',displayStatus,assignmentCount:skus.filter(sku=>matchesBadgeScope(flow,sku)).length,
    isSystemGenerated:false,source:null,referenceType:null,referenceId:null};
}
export function badgePositionCounts(flows:ReturnType<typeof badgeFlowView>[]) {
  const counts=Object.fromEntries(Object.values(BadgePosition).map(position=>[position,{running:0,upcoming:0}]));
  for(const flow of flows) for(const rule of flow.rules) {
    const position=rule.template?.defaultPosition;
    if(!position) continue;
    const key=badgeFlowRunning(flow,Date.now())?'running':'upcoming';
    counts[position]![key]++;
  }
  return counts;
}
