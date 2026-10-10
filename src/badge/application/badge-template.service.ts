import { BadRequestException,ConflictException,Injectable,NotFoundException } from '@nestjs/common';
import { BadgeTemplateRepository } from '../infrastructure/badge-template.repository';
import { badgeTemplateSchema,type BadgeTemplateInput,type BadgeTemplateQuery,type BadgeTemplateView } from '../domain/badge.schema';
import { BadgeType } from '../domain/badge.enum';
@Injectable()
export class BadgeTemplateService {
  constructor(private readonly repository:BadgeTemplateRepository) {}
  async detail(id:number):Promise<BadgeTemplateView> {
    const template=(await this.repository.list()).find(row=>row.id===id);
    if(!template) throw new NotFoundException({code:'BADGE_TEMPLATE_NOT_FOUND',message:'Không tìm thấy mẫu nhãn.'});
    return template;
  }
  async list(query:BadgeTemplateQuery) {
    const matched=(await this.repository.list()).filter(row=>
      (!query.search||(row.name+' '+row.code).toLowerCase().includes(query.search.toLowerCase())) &&
      (!query.status||row.status===query.status) && (!query.type||row.type===query.type) &&
      (!query.badgeType||row.badgeType===query.badgeType) && (!query.defaultPosition||row.defaultPosition===query.defaultPosition));
    const {page,take}=query;
    return {total:matched.length,list:matched.slice((page-1)*take,page*take),
      pagination:{page,take,itemCount:matched.length,pageCount:Math.ceil(matched.length/take),hasNextPage:page*take<matched.length,hasPreviousPage:page>1}};
  }
  async write(input:Partial<BadgeTemplateInput>,id?:number):Promise<BadgeTemplateView> {
    const current=id===undefined?{}:await this.detail(id);
    const result=badgeTemplateSchema.strip().safeParse({...current,...input});
    if(!result.success) throw new BadRequestException({code:'BADGE_VALIDATION_FAILED',message:'Dữ liệu mẫu nhãn không hợp lệ.',fieldErrors:result.error.issues});
    const parsed=result.data;
    this.validateDesign(parsed);
    try {return this.detail(await this.repository.save(parsed,id));}
    catch(error) {
      if(typeof error==='object'&&error!==null&&'code'in error&&error.code==='23505')
        throw new ConflictException({code:'BADGE_CODE_DUPLICATE',message:'Mã mẫu nhãn đã tồn tại.'});
      throw error;
    }
  }
  async delete(id:number):Promise<{success:boolean}> {
    const result=await this.repository.delete(id);
    if(result.flows.length) throw new ConflictException({code:'BADGE_TEMPLATE_IN_USE',message:'Mẫu nhãn đang được cấu hình sử dụng.',dependencies:result.flows.map(flowId=>({module:'Badge',id:flowId}))});
    if(!result.deleted) throw new NotFoundException({code:'BADGE_TEMPLATE_NOT_FOUND',message:'Không tìm thấy mẫu nhãn.'});
    return {success:true};
  }
  private validateDesign(input:BadgeTemplateInput):void {
    const valid=input.type===BadgeType.TEXT?Boolean(input.displayText?.trim()):
      input.type===BadgeType.ICON?Boolean(input.icon?.trim()):Boolean(input.image?.trim());
    if(!valid) throw new BadRequestException({code:'BADGE_DESIGN_REQUIRED',message:'Cần nhập nội dung chữ hoặc tải ảnh cho nhãn.'});
  }
}
