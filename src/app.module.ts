import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { PimModule } from './pim/pim.module';
import { CmsModule } from './cms/cms.module';
import { MediaModule } from './media/media.module';
import { BannerModule } from './banner/banner.module';
import { BadgeModule } from './badge/badge.module';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthModule, PimModule, CmsModule, MediaModule, BannerModule, BadgeModule],
  controllers: [HealthController],
})
export class AppModule {}
