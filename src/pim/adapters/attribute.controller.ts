import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { CatalogService } from '../application/catalog.service';
import { CatalogQueryDto, CatalogWriteDto } from './catalog.dto';
import type { CatalogList, CatalogRecord } from '../domain/catalog.interface';
@ApiTags('PIM attributes')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/catalog/attributes')
export class AttributeController {
  constructor(private readonly catalog: CatalogService) {}
  @Get()
  list(@Query() query: CatalogQueryDto): Promise<CatalogList> { return this.catalog.list('attributes',query); }
  @Get(':id')
  detail(@Param('id',ParseIntPipe) id: number): Promise<CatalogRecord> { return this.catalog.detail('attributes',id); }
  @Post()
  create(@Body() body: CatalogWriteDto): Promise<CatalogRecord> { return this.catalog.write('attributes',body); }
  @Put(':id')
  update(@Param('id',ParseIntPipe) id: number,@Body() body: CatalogWriteDto): Promise<CatalogRecord> { return this.catalog.write('attributes',body,id); }
  @Delete(':id')
  delete(@Param('id',ParseIntPipe) id: number): Promise<{ success: boolean }> { return this.catalog.delete('attributes',id); }
}
