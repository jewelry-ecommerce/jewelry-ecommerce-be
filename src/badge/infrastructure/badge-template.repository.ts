import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { BadgeTemplateInput,BadgeTemplateView } from '../domain/badge.schema';
const BADGE_SELECT=`id,name,code,type,badge_type AS "badgeType",status,display_text AS "displayText",
default_position AS "defaultPosition",style_config AS "styleConfig",icon,image,icon_mobile AS "iconMobile",
image_mobile AS "imageMobile",asset_meta AS "assetMeta",default_priority_weight AS "defaultPriorityWeight",description,
created_at AS "createdAt",updated_at AS "updatedAt"`;
type DatabaseTemplate=Omit<BadgeTemplateView,'createdAt'|'updatedAt'|'isSystem'|'assignments'|'rules'> & {createdAt:Date;updatedAt:Date};
@Injectable()
export class BadgeTemplateRepository {
  constructor(private readonly source:DataSource) {}
  async list():Promise<BadgeTemplateView[]> {
    const rows=await this.source.query<DatabaseTemplate[]>('SELECT '+BADGE_SELECT+' FROM badge_templates WHERE deleted_at IS NULL ORDER BY updated_at DESC,id DESC');
    return rows.map(row=>({...row,createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),isSystem:false,assignments:[],rules:[]}));
  }
  async save(input:BadgeTemplateInput,id?:number):Promise<number> {
    const values=[input.name,input.code,input.type,input.badgeType,input.status,input.displayText??null,input.defaultPosition,
      JSON.stringify(input.styleConfig??{}),input.icon??null,input.image??null,input.iconMobile??null,input.imageMobile??null,
      JSON.stringify(input.assetMeta??{}),input.defaultPriorityWeight,input.description??null];
    const sql=id===undefined?`INSERT INTO badge_templates(name,code,type,badge_type,status,display_text,default_position,style_config,icon,image,icon_mobile,image_mobile,asset_meta,default_priority_weight,description)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`:
      `WITH updated AS(UPDATE badge_templates SET name=$1,code=$2,type=$3,badge_type=$4,status=$5,display_text=$6,default_position=$7,
      style_config=$8,icon=$9,image=$10,icon_mobile=$11,image_mobile=$12,asset_meta=$13,default_priority_weight=$14,description=$15,
      updated_at=now() WHERE id=$16 AND deleted_at IS NULL RETURNING id) SELECT id FROM updated`;
    if(id!==undefined) values.push(id);
    const rows=await this.source.query<{id:number}[]>(sql,values);
    return rows[0]!.id;
  }
  async dependencies(id:number):Promise<number[]> {
    const rows=await this.source.query<{id:number}[]>(`SELECT flow.id FROM badge_flow_templates link JOIN badge_flows flow ON flow.id=link.flow_id
      WHERE link.template_id=$1 AND flow.deleted_at IS NULL`,[id]);
    return rows.map(row=>row.id);
  }
  async delete(id:number):Promise<{deleted:boolean;flows:number[]}> {
    return this.source.transaction(async manager=>{
      const templates=await manager.query<{id:number}[]>('SELECT id FROM badge_templates WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[id]);
      if(!templates.length) return {deleted:false,flows:[]};
      const flows=await manager.query<{id:number}[]>(`SELECT flow.id FROM badge_flow_templates link JOIN badge_flows flow ON flow.id=link.flow_id
        WHERE link.template_id=$1 AND flow.deleted_at IS NULL`,[id]);
      if(flows.length) return {deleted:false,flows:flows.map(flow=>flow.id)};
      await manager.query('UPDATE badge_templates SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL',[id]);
      return {deleted:true,flows:[]};
    });
  }
}
