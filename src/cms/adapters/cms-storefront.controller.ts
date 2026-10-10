import { Controller,Get,Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CmsService } from '../application/cms.service';
import type { StorefrontPage } from '../domain/cms.interface';
@ApiTags('CMS storefront')
@Controller('storefront/cms/pages')
export class CmsStorefrontController {
  constructor(private readonly pages:CmsService) {}
  @Get(':slug') page(@Param('slug') slug:string):Promise<StorefrontPage> {return this.pages.storefront(slug);}
}
