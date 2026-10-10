import { Module } from '@nestjs/common';
import { CmsController } from './adapters/cms.controller';
import { CmsStorefrontController } from './adapters/cms-storefront.controller';
import { CmsService } from './application/cms.service';
import { CmsRepository } from './infrastructure/cms.repository';
@Module({controllers:[CmsController,CmsStorefrontController],providers:[CmsService,CmsRepository]})
export class CmsModule {}
