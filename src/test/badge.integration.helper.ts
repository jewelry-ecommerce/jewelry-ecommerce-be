import assert from 'node:assert/strict';
import type { DataSource } from 'typeorm';
type Purpose='CAMPAIGN'|'OUT_OF_STOCK'|'PRE_ORDER';
async function post(base:string,path:string,token:string,body:unknown) {
  const response=await fetch(base+'/api/v1/'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
  return {status:response.status,body:await response.json() as {id:number;code?:string}};
}
async function createBadgeFlow(base:string,token:string,tag:string,purpose:Purpose,productId:number,skuId:number):Promise<{templateId:number;flowId:number}> {
  const template=await post(base,'admin/badge-templates',token,{name:'Badge '+tag+' '+purpose,code:'BADGE_'+tag+'_'+purpose,
    type:'TEXT',badgeType:purpose,status:'ACTIVE',displayText:purpose,defaultPosition:'TOP_LEFT'});
  assert.equal(template.status,201);
  const ruleType=purpose==='OUT_OF_STOCK'?'OUT_OF_STOCK':purpose==='PRE_ORDER'?'MANUAL':'ALL';
  const ruleConfig=ruleType==='MANUAL'?{targets:[{productId,productVariantId:skuId}]}:{};
  const flow=await post(base,'admin/badge-flow',token,{name:'Flow '+tag+' '+purpose,status:'ACTIVE',ruleType,ruleConfig,
    templates:[{badgeTemplateId:template.body.id}]});
  assert.equal(flow.status,201,JSON.stringify(flow.body));assert.equal(typeof flow.body.id,'number');
  return {templateId:template.body.id,flowId:flow.body.id};
}
async function assertBadge(base:string,skuId:number,code:string):Promise<void> {
  const response=await fetch(base+'/api/v1/storefront/badge?skuIds='+skuId);
  assert.equal(response.status,200);
  const result=await response.json() as {productVariantId:number;badges:{badgeTemplateId:number;code:string}[]}[];
  assert.equal(result[0]!.productVariantId,skuId);assert.equal(result[0]!.badges.length,1);
  assert.equal(result[0]!.badges[0]!.code,code);assert.equal(typeof result[0]!.badges[0]!.badgeTemplateId,'number');
}
async function stopFlow(base:string,token:string,id:number):Promise<void> {
  const response=await fetch(base+'/api/v1/admin/badge-flow/'+id+'/deactivate',{method:'PATCH',headers:{Authorization:'Bearer '+token}});
  assert.equal(response.status,200,await response.clone().text());
}
export async function exerciseBadgeResolution(base:string,token:string,tag:string,productId:number,skuId:number,source:DataSource):Promise<void> {
  const campaign=await createBadgeFlow(base,token,tag,'CAMPAIGN',productId,skuId);
  const outOfStock=await createBadgeFlow(base,token,tag,'OUT_OF_STOCK',productId,skuId);
  await assertBadge(base,skuId,'BADGE_'+tag+'_CAMPAIGN');
  const preOrder=await createBadgeFlow(base,token,tag,'PRE_ORDER',productId,skuId);
  await assertBadge(base,skuId,'BADGE_'+tag+'_PRE_ORDER');
  await source.query('UPDATE product_variations SET on_hand=0 WHERE id=$1',[skuId]);
  try {
    await assertBadge(base,skuId,'BADGE_'+tag+'_PRE_ORDER');
    await stopFlow(base,token,preOrder.flowId);
    await assertBadge(base,skuId,'BADGE_'+tag+'_OUT_OF_STOCK');
    await stopFlow(base,token,outOfStock.flowId);
    await assertBadge(base,skuId,'BADGE_'+tag+'_CAMPAIGN');
    const deletion=await fetch(base+'/api/v1/admin/badge-templates/'+campaign.templateId,{method:'DELETE',headers:{Authorization:'Bearer '+token}});
    assert.equal(deletion.status,409);
    const invalid=await post(base,'admin/badge-flow',token,{name:'Invalid '+tag,ruleType:'MANUAL',
      ruleConfig:{targets:[{productId,productVariantId:skuId+100000}]},templates:[{badgeTemplateId:campaign.templateId}]});
    assert.equal(invalid.status,400);
  } finally {await source.query('UPDATE product_variations SET on_hand=5 WHERE id=$1',[skuId]);}
}
