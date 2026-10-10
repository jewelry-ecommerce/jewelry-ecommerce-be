import { BadRequestException,Injectable,NotFoundException } from '@nestjs/common';
import { BadgeFlowRepository } from '../infrastructure/badge-flow.repository';
import { BadgeSkuRepository } from '../infrastructure/badge-sku.repository';
import { BadgeTemplateRepository } from '../infrastructure/badge-template.repository';
import { badgeFlowSchema,type BadgeFlowInput } from '../domain/badge-flow.schema';
import { badgeFlowView,badgePositionCounts } from '../domain/badge-flow.mapper';
import type { BadgeTemplateQuery } from '../domain/badge.schema';
import { validateBadgeFlow } from '../domain/badge-flow.validation';
@Injectable()
export class BadgeFlowService {
  constructor(private readonly repository:BadgeFlowRepository,private readonly templates:BadgeTemplateRepository,private readonly skus:BadgeSkuRepository) {}
  async views() {
    const [rows,links,templates,skus]=await Promise.all([this.repository.rows(),this.repository.links(),this.templates.list(),this.skus.published()]);
    return rows.map(flow=>badgeFlowView(flow,links,templates,skus));
  }
  async detail(id:number) {
    const flow=(await this.views()).find(flow=>flow.id===id);
    if(!flow) throw new NotFoundException({code:'BADGE_FLOW_NOT_FOUND',message:'Không tìm thấy cấu hình nhãn.'});
    return flow;
  }
  async list(query:Pick<BadgeTemplateQuery,'page'|'take'|'status'|'search'> & {displayStatus?:string}) {
    const flows=await this.views(),{page,take}=query;
    const matched=flows.filter(flow=>(!query.status||flow.status===query.status)&&(!query.displayStatus||flow.displayStatus===query.displayStatus)&&(!query.search||flow.name.toLowerCase().includes(query.search.toLowerCase())));
    return {total:matched.length,list:matched.slice((page-1)*take,page*take),positionCounts:badgePositionCounts(flows),
      counts:{all:flows.length,active:flows.filter(flow=>flow.status==='ACTIVE').length,inactive:flows.filter(flow=>flow.status==='INACTIVE').length,draft:flows.filter(flow=>flow.status==='DRAFT').length},
      pagination:{page,take,itemCount:matched.length,pageCount:Math.ceil(matched.length/take),hasNextPage:page*take<matched.length,hasPreviousPage:page>1}};
  }
  async write(input:Partial<BadgeFlowInput>,id?:number) {
    const current=id===undefined?{}:await this.detail(id);
    const result=badgeFlowSchema.strip().safeParse({...current,...input});
    if(!result.success) throw new BadRequestException({code:'BADGE_FLOW_INVALID',message:'Cấu hình nhãn không hợp lệ.',fieldErrors:result.error.issues});
    validateBadgeFlow(result.data);
    return this.detail(await this.repository.save(result.data,id));
  }
  async delete(id:number):Promise<{success:boolean}> {
    await this.detail(id);await this.repository.delete(id);return {success:true};
  }
}
