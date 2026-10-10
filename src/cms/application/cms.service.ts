import { BadRequestException,ConflictException,Injectable,NotFoundException } from '@nestjs/common';
import { CmsRepository } from '../infrastructure/cms.repository';
import { CmsStatus } from '../domain/cms.enum';
import { CMS_POLICY,validateCmsPage } from '../domain/cms.validation';
import type { CmsPage,CmsPageInput,CmsPageRow,StorefrontPage } from '../domain/cms.interface';
import { slugify } from '../../pim/domain/catalog.validation';
@Injectable()
export class CmsService {
  constructor(private readonly repository:CmsRepository) {}
  async list():Promise<CmsPage[]> {
    return Promise.all((await this.repository.list()).map(row=>this.mapPage(row)));
  }
  async detail(id:number):Promise<CmsPage> {
    const row=(await this.repository.list()).find(page=>page.id===id);
    if(!row) throw this.notFound();
    return this.mapPage(row);
  }
  async save(input:CmsPageInput,id?:number):Promise<CmsPage> {
    validateCmsPage(input);
    if(id!==undefined) await this.validateUpdate(id,input);
    const slug=slugify(input.slug);
    if(!slug) throw new BadRequestException({code:'CMS_SLUG_INVALID',message:'Slug trang không hợp lệ.'});
    try {
      const pageId=await this.repository.save({...input,slug},id);
      if(pageId===null) throw new ConflictException({code:'CMS_REVISION_CONFLICT',message:'Trang đã được sửa ở nơi khác. Vui lòng tải lại.'});
      return this.detail(pageId);
    } catch(error) {
      if(typeof error==='object' && error!==null && 'code'in error && error.code==='23505') {
        throw new ConflictException({code:'CMS_SLUG_DUPLICATE',message:'Slug trang đã tồn tại.'});
      }
      throw error;
    }
  }
  async delete(id:number):Promise<{success:boolean}> {
    await this.detail(id);await this.repository.delete(id);return {success:true};
  }
  async storefront(slug:string):Promise<StorefrontPage> {
    const row=(await this.repository.list()).find(page=>page.slug===slug && page.is_active && page.status===CmsStatus.PUBLISHED);
    if(!row) throw this.notFound();
    const page=await this.mapPage(row);
    return {
      page:{id:page.id,name:page.name,slug:page.slug,locale:page.locale,seo:page.seo},
      layout:{id:CMS_POLICY.layoutId,name:CMS_POLICY.layoutName,targetDevice:CMS_POLICY.targetDevice,versionId:String(page.revision),versionName:String(page.revision)},
      blocks:page.blocks.filter(block=>block.isVisible),
    };
  }
  private async validateUpdate(id:number,input:CmsPageInput):Promise<void> {
    const current=await this.detail(id);
    if(input.revision!==current.revision) throw new ConflictException({code:'CMS_REVISION_CONFLICT',message:'Trang đã được sửa ở nơi khác.'});
    const known=new Set(current.blocks.map(block=>block.id));
    if(input.blocks.some(block=>block.id!==undefined && !known.has(block.id))) {
      throw new BadRequestException({code:'CMS_BLOCK_NOT_OWNED',message:'Block không thuộc trang này.'});
    }
  }
  private async mapPage(row:CmsPageRow):Promise<CmsPage> {
    const blocks=await this.repository.blocks(row.id);
    return {
      id:row.id,name:row.name,slug:row.slug,locale:row.locale,status:row.status,
      revision:row.revision,isActive:row.is_active,seo:row.seo,
      blocks:blocks.map(block=>({id:block.id,blockTypeCode:block.block_type_code,sortOrder:block.sort_order,isVisible:block.is_visible,config:block.config})),
    };
  }
  private notFound():NotFoundException {return new NotFoundException({code:'CMS_PAGE_NOT_FOUND',message:'Trang không tồn tại hoặc chưa xuất bản.'});}
}
