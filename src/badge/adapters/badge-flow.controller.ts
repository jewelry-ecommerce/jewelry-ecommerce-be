import { BadRequestException,Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,Put,Query,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { BadgeFlowService } from '../application/badge-flow.service';
import { BadgeResolverService } from '../application/badge-resolver.service';
import { BADGE_FLOW_POLICY,BadgeChannel,badgeFlowPatchSchema,badgeFlowSchema } from '../domain/badge-flow.schema';
import { BADGE_POLICY,badgeQuerySchema } from '../domain/badge.schema';
import { BadgeStatus } from '../domain/badge.enum';
const flowQuerySchema=badgeQuerySchema.pick({page:true,take:true,search:true,status:true}).extend({
  displayStatus:z.enum(['DRAFT','SCHEDULED','RUNNING','PAUSED','ENDED']).optional(),
});
const resolveQuerySchema=z.object({
  skuIds:z.string().regex(/^[1-9][0-9]*(,[1-9][0-9]*)*$/),
  channel:z.enum(BadgeChannel).default(BadgeChannel.WEB),
}).strict();
function parse<T>(schema:z.ZodType<T>,input:unknown):T {
  const result=schema.safeParse(input);
  if(!result.success) throw new BadRequestException({code:'BADGE_FLOW_INVALID',message:'Cấu hình hoặc tham số nhãn không hợp lệ.',fieldErrors:result.error.issues});
  return result.data;
}
@ApiTags('Badge flows')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/badge-flow')
export class BadgeFlowController {
  constructor(private readonly flows:BadgeFlowService) {}
  @Get() list(@Query() query:unknown) {return this.flows.list(parse(flowQuerySchema,query));}
  @Get(':id') detail(@Param('id',ParseIntPipe) id:number) {return this.flows.detail(id);}
  @Post() create(@Body() body:unknown) {return this.flows.write(parse(badgeFlowSchema,body));}
  @Put(':id') update(@Param('id',ParseIntPipe) id:number,@Body() body:unknown) {return this.flows.write(parse(badgeFlowPatchSchema,body),id);}
  @Patch(':id') patch(@Param('id',ParseIntPipe) id:number,@Body() body:unknown) {return this.flows.write(parse(badgeFlowPatchSchema,body),id);}
  @Patch(':id/activate') activate(@Param('id',ParseIntPipe) id:number) {return this.flows.write({status:BadgeStatus.ACTIVE},id);}
  @Patch(':id/deactivate') deactivate(@Param('id',ParseIntPipe) id:number) {return this.flows.write({status:BadgeStatus.INACTIVE},id);}
  @Delete(':id') delete(@Param('id',ParseIntPipe) id:number) {return this.flows.delete(id);}
}
@ApiTags('Storefront badge')
@Controller('storefront/badge')
export class StorefrontBadgeController {
  constructor(private readonly resolver:BadgeResolverService) {}
  @Get() resolve(@Query() query:unknown) {
    const parsed=parse(resolveQuerySchema,query),ids=[...new Set(parsed.skuIds.split(',').map(Number))];
    if(ids.length>BADGE_FLOW_POLICY.maximumSkus||ids.some(id=>!Number.isSafeInteger(id)||id>BADGE_POLICY.maximumId))
      throw new BadRequestException({code:'BADGE_SKU_QUERY_INVALID',message:'Danh sách SKU không hợp lệ hoặc quá giới hạn.'});
    return this.resolver.resolve(ids,parsed.channel);
  }
}
