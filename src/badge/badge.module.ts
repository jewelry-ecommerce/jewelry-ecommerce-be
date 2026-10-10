import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BadgeTemplateController } from './adapters/badge-template.controller';
import { BadgeTemplateService } from './application/badge-template.service';
import { BadgeTemplateRepository } from './infrastructure/badge-template.repository';
import { BadgeFlowController,StorefrontBadgeController } from './adapters/badge-flow.controller';
import { BadgeFlowService } from './application/badge-flow.service';
import { BadgeResolverService } from './application/badge-resolver.service';
import { BadgeFlowRepository } from './infrastructure/badge-flow.repository';
import { BadgeSkuRepository } from './infrastructure/badge-sku.repository';
@Module({imports:[AuthModule],controllers:[BadgeTemplateController,BadgeFlowController,StorefrontBadgeController],
  providers:[BadgeTemplateService,BadgeTemplateRepository,BadgeFlowService,BadgeFlowRepository,BadgeSkuRepository,BadgeResolverService]})
export class BadgeModule {}
