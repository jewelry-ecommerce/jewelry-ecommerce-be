import { Controller,Get,Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BannerService } from '../application/banner.service';
@ApiTags('Banner storefront')
@Controller('storefront/banner/placements/code')
export class BannerStorefrontController {
  constructor(private readonly banners:BannerService) {}
  @Get(':code/render') render(@Param('code') code:string):Promise<Record<string,unknown>> {return this.banners.render(code);}
}
