import { BadRequestException,Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,Put,Query,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { BadgeTemplateService } from '../application/badge-template.service';
import { badgePatchSchema,badgeQuerySchema,badgeStatusSchema,badgeTemplateSchema } from '../domain/badge.schema';
function parseBadge<T>(schema:z.ZodType<T>,body:unknown):T {
  const parsed=schema.safeParse(body);
  if(!parsed.success) throw new BadRequestException({code:'BADGE_VALIDATION_FAILED',message:'Dữ liệu nhãn không hợp lệ.',fieldErrors:parsed.error.issues});
  return parsed.data;
}
@ApiTags('Badge templates')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/badge-templates')
export class BadgeTemplateController {
  constructor(private readonly templates:BadgeTemplateService) {}
  @Get()
  list(@Query() query:unknown) {return this.templates.list(parseBadge(badgeQuerySchema,query));}
  @Get(':id')
  detail(@Param('id',ParseIntPipe) id:number) {return this.templates.detail(id);}
  @Post()
  create(@Body() body:unknown) {return this.templates.write(parseBadge(badgeTemplateSchema,body));}
  @Patch(':id/status')
  status(@Param('id',ParseIntPipe) id:number,@Body() body:unknown) {return this.templates.write(parseBadge(badgeStatusSchema,body),id);}
  @Patch(':id')
  patch(@Param('id',ParseIntPipe) id:number,@Body() body:unknown) {return this.templates.write(parseBadge(badgePatchSchema,body),id);}
  @Put(':id')
  update(@Param('id',ParseIntPipe) id:number,@Body() body:unknown) {return this.templates.write(parseBadge(badgePatchSchema,body),id);}
  @Delete(':id')
  delete(@Param('id',ParseIntPipe) id:number) {return this.templates.delete(id);}
}
