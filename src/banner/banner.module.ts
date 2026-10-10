import { Module } from '@nestjs/common';
import { BannerController } from './adapters/banner.controller';
import { BannerStorefrontController } from './adapters/banner-storefront.controller';
import { BannerService } from './application/banner.service';
import { BannerRepository } from './infrastructure/banner.repository';
@Module({controllers:[BannerController,BannerStorefrontController],providers:[BannerService,BannerRepository]})
export class BannerModule {}
