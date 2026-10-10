import { BadRequestException,Injectable,NotFoundException } from '@nestjs/common';
import { DataSource,type EntityManager } from 'typeorm';
import type { BadgeFlowInput,BadgeFlowLink,BadgeFlowRow } from '../domain/badge-flow.schema';
type DbFlow=Omit<BadgeFlowRow,'createdAt'|'updatedAt'|'activeFrom'|'activeTo'> & {createdAt:Date;updatedAt:Date;activeFrom:Date|null;activeTo:Date|null};
@Injectable()
export class BadgeFlowRepository {
  constructor(private readonly source:DataSource) {}
  async rows():Promise<BadgeFlowRow[]> {
    const records=await this.source.query<DbFlow[]>(`SELECT id,name,description,rule_type AS "ruleType",rule_config AS "ruleConfig",channel,status,
      active_from AS "activeFrom",active_to AS "activeTo",created_at AS "createdAt",updated_at AS "updatedAt"
      FROM badge_flows WHERE deleted_at IS NULL ORDER BY updated_at DESC,id DESC`);
    return records.map(row=>({...row,activeFrom:row.activeFrom?.toISOString(),activeTo:row.activeTo?.toISOString(),
      createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString()}));
  }
  async links():Promise<BadgeFlowLink[]> {
    return this.source.query(`SELECT id,flow_id AS "flowId",template_id AS "badgeTemplateId",priority_weight AS "priorityWeight",is_pinned AS "isPinned"
      FROM badge_flow_templates ORDER BY id`);
  }
  async save(input:BadgeFlowInput,id?:number):Promise<number> {
    return this.source.transaction(async manager=>{
      if(id!==undefined) await this.lock(manager,id);
      await this.checkTemplate(manager,input);
      await this.checkScope(manager,input);
      const values=[input.name,input.description??null,input.ruleType,JSON.stringify(input.ruleConfig),input.channel,input.status,input.activeFrom??null,input.activeTo??null];
      const sql=id===undefined?`INSERT INTO badge_flows(name,description,rule_type,rule_config,channel,status,active_from,active_to)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`:
        `WITH saved AS(UPDATE badge_flows SET name=$1,description=$2,rule_type=$3,rule_config=$4,channel=$5,status=$6,active_from=$7,active_to=$8,
        updated_at=now() WHERE id=$9 AND deleted_at IS NULL RETURNING id) SELECT id FROM saved`;
      const saved=await manager.query<{id:number}[]>(sql,id===undefined?values:[...values,id]);
      const flowId=saved[0]!.id;
      await manager.query('DELETE FROM badge_flow_templates WHERE flow_id=$1',[flowId]);
      for(const template of input.templates) await manager.query(
        'INSERT INTO badge_flow_templates(flow_id,template_id,priority_weight,is_pinned) VALUES($1,$2,$3,$4)',
        [flowId,template.badgeTemplateId,template.priorityWeight,template.isPinned]);
      return flowId;
    });
  }
  async delete(id:number):Promise<void> {
    await this.source.transaction(async manager=>{
      await this.lock(manager,id);
      await manager.query('UPDATE badge_flows SET deleted_at=now(),updated_at=now() WHERE id=$1',[id]);
    });
  }
  private async checkScope(manager:EntityManager,input:BadgeFlowInput):Promise<void> {
    const config=input.ruleConfig;
    await this.checkIds(manager,'categories',[...(config.categoryIds??[]),...(config.categories??[]).map(category=>category.categoryId)]);
    await this.checkIds(manager,'collections',[...(config.collectionIds??[]),...(config.collections??[]).map(collection=>collection.collectionId)]);
    if(!config.targets?.length) return;
    const rows=await manager.query<{id:number}[]>(`SELECT sku.id FROM product_variations sku
      JOIN products product ON product.id=sku.product_id AND product.deleted_at IS NULL
      JOIN jsonb_to_recordset($1::jsonb) AS target("productId" int,"productVariantId" int)
      ON target."productVariantId"=sku.id AND target."productId"=sku.product_id WHERE sku.deleted_at IS NULL`,[JSON.stringify(config.targets)]);
    if(new Set(rows.map(row=>row.id)).size!==new Set(config.targets.map(target=>target.productVariantId)).size)
      throw new BadRequestException({code:'BADGE_SCOPE_TARGET_INVALID',message:'SKU đã chọn không tồn tại hoặc không thuộc sản phẩm.'});
  }
  private async checkIds(manager:EntityManager,table:'categories'|'collections',ids:number[]):Promise<void> {
    if(!ids.length) return;
    const rows=await manager.query<{id:number}[]>('SELECT id FROM '+table+' WHERE id=ANY($1::int[]) AND deleted_at IS NULL',[ids]);
    if(rows.length!==new Set(ids).size) throw new BadRequestException({code:'BADGE_SCOPE_TARGET_INVALID',message:'Danh mục hoặc bộ sưu tập áp dụng không tồn tại.'});
  }
  private async lock(manager:EntityManager,id:number):Promise<void> {
    const rows=await manager.query<{id:number}[]>('SELECT id FROM badge_flows WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[id]);
    if(!rows.length) throw new NotFoundException({code:'BADGE_FLOW_NOT_FOUND',message:'Không tìm thấy cấu hình nhãn.'});
  }
  private async checkTemplate(manager:EntityManager,input:BadgeFlowInput):Promise<void> {
    const rows=await manager.query<{id:number;status:string}[]>('SELECT id,status FROM badge_templates WHERE id=$1 AND deleted_at IS NULL FOR SHARE',[input.templates[0]!.badgeTemplateId]);
    if(!rows.length || (input.status==='ACTIVE' && rows[0]!.status!=='ACTIVE'))
      throw new BadRequestException({code:'BADGE_TEMPLATE_UNAVAILABLE',message:'Cần chọn mẫu nhãn đang hoạt động để bật cấu hình.'});
  }
}
