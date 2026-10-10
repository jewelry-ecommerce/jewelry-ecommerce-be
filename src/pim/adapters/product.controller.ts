import { Body,Controller,Get,Param,ParseIntPipe,Patch,Post,Put,Query,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { ProductService } from '../application/product.service';
import { ProductStatusDto,ProductWriteDto } from './product.dto';
import { ProductQueryDto } from './product-query.dto';
import type { ProductView } from '../domain/product.interface';
@ApiTags('PIM products')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/catalog/products')
export class ProductController {
  constructor(private readonly products:ProductService) {}
  @Get()
  list(@Query() query:ProductQueryDto):Promise<{total:number;list:ProductView[]}> { return this.products.list(query); }
  @Get(':id')
  detail(@Param('id',ParseIntPipe) id:number):Promise<ProductView> { return this.products.detail(id); }
  @Post()
  create(@Body() body:ProductWriteDto):Promise<ProductView> { return this.products.create(body); }
  @Put(':id')
  update(@Param('id',ParseIntPipe) id:number,@Body() body:ProductWriteDto):Promise<ProductView> { return this.products.update(id,body); }
  @Patch(':id/status')
  status(@Param('id',ParseIntPipe) id:number,@Body() body:ProductStatusDto):Promise<ProductView> { return this.products.status(id,body.status); }
}
