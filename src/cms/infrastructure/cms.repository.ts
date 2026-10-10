import { Injectable } from '@nestjs/common';
import { DataSource,EntityManager } from 'typeorm';
import type { CmsPageRow,CmsBlockRow,CmsPageInput } from '../domain/cms.interface';
import { CMS_POLICY } from '../domain/cms.validation';
@Injectable()
export class CmsRepository {
  constructor(private readonly source:DataSource) {}
  list():Promise<CmsPageRow[]> {
    return this.source.query<CmsPageRow[]>('SELECT * FROM cms_pages WHERE deleted_at IS NULL ORDER BY id DESC');
  }
  blocks(pageId:number):Promise<CmsBlockRow[]> {
    return this.source.query<CmsBlockRow[]>('SELECT * FROM cms_blocks WHERE page_id=$1 AND deleted_at IS NULL ORDER BY sort_order,id',[pageId]);
  }
  async save(input:CmsPageInput,id?:number):Promise<number|null> {
    return this.source.transaction(async manager=>{
      const pageId=await this.writePage(manager,input,id);
      if(pageId===null) return null;
      await this.replaceBlocks(manager,pageId,input.blocks);
      return pageId;
    });
  }
  async delete(id:number):Promise<void> {
    await this.source.query('UPDATE cms_pages SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL',[id]);
  }
  private async writePage(manager:EntityManager,input:CmsPageInput,id?:number):Promise<number|null> {
    const values:unknown[]=[input.name,input.slug,input.locale||CMS_POLICY.locale,input.status,input.isActive,input.seo];
    const sql=id===undefined
      ?'INSERT INTO cms_pages(name,slug,locale,status,is_active,seo) VALUES($1,$2,$3,$4,$5,$6) RETURNING id'
      :'WITH updated AS (UPDATE cms_pages SET name=$1,slug=$2,locale=$3,status=$4,is_active=$5,seo=$6,revision=revision+1,updated_at=now() WHERE id=$7 AND revision=$8 AND deleted_at IS NULL RETURNING id) SELECT id FROM updated';
    if(id!==undefined) values.push(id,input.revision);
    const rows=await manager.query<{id:number}[]>(sql,values);
    return rows[0]?.id??null;
  }
  private async replaceBlocks(manager:EntityManager,pageId:number,blocks:CmsPageInput['blocks']):Promise<void> {
    const keep=blocks.flatMap(block=>block.id===undefined?[]:[block.id]);
    await manager.query('DELETE FROM cms_blocks WHERE page_id=$1 AND NOT(id=ANY($2::int[]))',[pageId,keep]);
    for(const [index,block]of blocks.entries()) {
      const values:unknown[]=[pageId,block.blockTypeCode,index,block.isVisible,block.config];
      if(block.id===undefined) {
        await manager.query('INSERT INTO cms_blocks(page_id,block_type_code,sort_order,is_visible,config) VALUES($1,$2,$3,$4,$5)',values);
      } else {
        await manager.query('UPDATE cms_blocks SET block_type_code=$2,sort_order=$3,is_visible=$4,config=$5,updated_at=now() WHERE page_id=$1 AND id=$6',[...values,block.id]);
      }
    }
  }
}
