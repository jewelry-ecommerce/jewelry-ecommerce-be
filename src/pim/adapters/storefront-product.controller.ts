
import { Controller,Get,Query,Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontProductService } from '../application/storefront-product.service';
import { StorefrontProductQueryDto } from './storefront-product-query.dto';
@ApiTags('PIM storefront')
@Controller('storefront/product')
export class StorefrontProductController {
  constructor(private readonly products:StorefrontProductService) {}
  @Get(':slug')
  detail(@Param('slug') slug:string):ReturnType<StorefrontProductService['detail']> {return this.products.detail(slug);}
  @Get()
  list(@Query() query:StorefrontProductQueryDto):ReturnType<StorefrontProductService['list']> {
    return this.products.list(query);
  }
}
