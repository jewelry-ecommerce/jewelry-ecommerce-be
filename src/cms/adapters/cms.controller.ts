import { Body,Controller,Delete,Get,Param,ParseIntPipe,Post,Put,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { CmsService } from '../application/cms.service';
import { CmsPageDto } from './cms.dto';
import type { CmsPage } from '../domain/cms.interface';
@ApiTags('CMS administration')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/cms/pages')
export class CmsController {
  constructor(private readonly pages:CmsService) {}
  @Get() list():Promise<CmsPage[]> {return this.pages.list();}
  @Get(':id') detail(@Param('id',ParseIntPipe) id:number):Promise<CmsPage> {return this.pages.detail(id);}
  @Post() create(@Body() body:CmsPageDto):Promise<CmsPage> {return this.pages.save(body);}
  @Put(':id') update(@Param('id',ParseIntPipe) id:number,@Body() body:CmsPageDto):Promise<CmsPage> {return this.pages.save(body,id);}
  @Delete(':id') delete(@Param('id',ParseIntPipe) id:number):Promise<{success:boolean}> {return this.pages.delete(id);}
}
