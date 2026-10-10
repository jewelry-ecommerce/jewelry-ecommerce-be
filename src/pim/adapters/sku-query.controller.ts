import { Controller,Get,Query,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { SkuQueryService } from '../application/sku-query.service';
import { SkuQueryDto } from './sku-query.dto';
import type { SkuPickerPage } from '../domain/sku-query.interface';
@ApiTags('PIM SKU picker')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/catalog/skus')
export class SkuQueryController {
  constructor(private readonly skus:SkuQueryService) {}
  @Get() list(@Query() query:SkuQueryDto):Promise<SkuPickerPage> {return this.skus.list(query);}
}
