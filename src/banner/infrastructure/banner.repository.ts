import { Injectable } from '@nestjs/common';
import { DataSource,EntityManager } from 'typeorm';
import { BANNER_COLUMNS,BANNER_JSON_COLUMNS,type BannerTable } from './banner.columns';
import type { BannerDemoCommand } from '../domain/banner.schema';
type CreateLayout=Extract<BannerDemoCommand,{operation:'postPlacementLayout'}>;
@Injectable()
export class BannerRepository {
  constructor(private readonly source:DataSource) {}
  async rows(table:BannerTable):Promise<Record<string,unknown>[]> {
    const fields=Object.entries(BANNER_COLUMNS[table]).map(([key,column])=>column+' AS "'+key+'"');
    const rows=await this.source.query<Record<string,unknown>[]>(`SELECT id,created_at AS "createdAt",updated_at AS "updatedAt",${fields.join(',')} FROM ${table} WHERE deleted_at IS NULL ORDER BY id`);
    return rows.map(row=>Object.fromEntries(Object.entries(row).filter(([,value])=>value!==null).map(([key,value])=>[key,value instanceof Date?value.toISOString():value])));
  }
  async save(table:BannerTable,data:Readonly<Record<string,unknown>>,id?:number):Promise<number> {
    return this.write(this.source.manager,table,data,id);
  }
  async deletePlacement(id:number):Promise<void> {
    await this.source.query('UPDATE banner_placements SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL',[id]);
  }
  async saveLayout(command:CreateLayout):Promise<number> {
    return this.source.transaction(async manager=>{
      await manager.query('SELECT id FROM banner_placements WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[command.placementId]);
      const previous=await manager.query<{revision:number}[]>('SELECT revision FROM banner_placement_layouts WHERE placement_id=$1 ORDER BY revision DESC LIMIT 1',[command.placementId]);
      if(command.data.status==='ACTIVE') await manager.query('UPDATE banner_placement_layouts SET status=$1,updated_at=now() WHERE placement_id=$2 AND status=$3',['INACTIVE',command.placementId,'ACTIVE']);
      const id=await this.write(manager,'banner_placement_layouts',{...command.data,placementId:command.placementId,revision:(previous[0]?.revision??0)+1,status:command.data.status??'DRAFT'});
      for(const entry of command.data.items) {
        await this.write(manager,'banner_layout_items',{...entry,placementLayoutId:id,isActive:entry.isActive??true,priority:entry.priority??0,
          displayMetadata:entry.displayMetadata??{x:0,y:0,width:1,height:1,order:0}});
      }
      return id;
    });
  }
  private async write(manager:EntityManager,table:BannerTable,data:Readonly<Record<string,unknown>>,id?:number):Promise<number> {
    const entries=Object.entries(BANNER_COLUMNS[table]).filter(([key])=>data[key]!==undefined);
    if(!entries.length && id!==undefined) return id;
    const columns=entries.map(([,column])=>column);
    const values:unknown[]=entries.map(([key])=>BANNER_JSON_COLUMNS.has(key)?JSON.stringify(data[key]):data[key]);
    const placeholders=values.map((_,index)=>'$'+(index+1));
    const sql=id===undefined
      ?`INSERT INTO ${table}(${columns.join(',')}) VALUES(${placeholders.join(',')}) RETURNING id`
      :`WITH updated AS (UPDATE ${table} SET ${columns.map((column,index)=>column+'='+placeholders[index]).join(',')},updated_at=now() WHERE id=$${values.length+1} AND deleted_at IS NULL RETURNING id) SELECT id FROM updated`;
    if(id!==undefined) values.push(id);
    const rows=await manager.query<{id:number}[]>(sql,values);
    if(!rows[0]) throw new Error('Banner write returned no record');
    return rows[0].id;
  }
}
