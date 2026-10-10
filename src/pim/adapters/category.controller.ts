import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { CatalogService } from '../application/catalog.service';
import { CatalogQueryDto, CatalogWriteDto } from './catalog.dto';
import type { CatalogList, CatalogRecord } from '../domain/catalog.interface';
import type { CategoryView } from '../domain/category-tree.util';
@ApiTags('PIM categories')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/catalog/categories')
export class CategoryController {
  constructor(private readonly catalog: CatalogService) {}
  @Get()
  list(@Query() query: CatalogQueryDto): Promise<CatalogList> { return this.catalog.list('categories',query); }
  @Get('tree')
  tree(@Query() query:CatalogQueryDto): Promise<CategoryView[]> { return this.catalog.categoryTree(query.status); }
  @Get(':id')
  detail(@Param('id',ParseIntPipe) id: number): Promise<CatalogRecord> { return this.catalog.detail('categories',id); }
  @Post()
  create(@Body() body: CatalogWriteDto): Promise<CatalogRecord> { return this.catalog.write('categories',body); }
  @Put(':id')
  update(@Param('id',ParseIntPipe) id: number,@Body() body: CatalogWriteDto): Promise<CatalogRecord> { return this.catalog.write('categories',body,id); }
  @Delete(':id')
  delete(@Param('id',ParseIntPipe) id: number): Promise<{ success: boolean }> { return this.catalog.delete('categories',id); }
}
