
import { Body,Controller,Post,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { SkuMatrixService } from '../application/sku-matrix.service';
import { MatrixDto } from './sku-matrix.dto';
import type { MatrixView } from '../domain/sku-matrix.interface';
@ApiTags('PIM SKU matrix')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/catalog/sku-matrix')
export class SkuMatrixController {
  constructor(private readonly matrix:SkuMatrixService) {}
  @Post('preview')
  preview(@Body() body:MatrixDto):Promise<MatrixView> {return this.matrix.preview(body);}
}
