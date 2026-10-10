import { Module } from '@nestjs/common';
import { CatalogRepository } from './infrastructure/catalog.repository';
import { CatalogService } from './application/catalog.service';
import { CategoryController } from './adapters/category.controller';
import { AttributeController } from './adapters/attribute.controller';
import { CollectionController } from './adapters/collection.controller';
import { ProductController } from './adapters/product.controller';
import { ProductService } from './application/product.service';
import { ProductRepository } from './infrastructure/product.repository';
import { SkuMatrixController } from './adapters/sku-matrix.controller';
import { SkuMatrixService } from './application/sku-matrix.service';
import { StorefrontProductService } from './application/storefront-product.service';
import { StorefrontProductController } from './adapters/storefront-product.controller';
import { SkuQueryController } from './adapters/sku-query.controller';
import { SkuQueryService } from './application/sku-query.service';
import { SkuQueryRepository } from './infrastructure/sku-query.repository';
@Module({
  controllers: [CategoryController,AttributeController,CollectionController,ProductController,SkuMatrixController,StorefrontProductController,SkuQueryController],
  providers: [CatalogRepository,CatalogService,ProductRepository,ProductService,SkuMatrixService,StorefrontProductService,SkuQueryService,SkuQueryRepository],
})
export class PimModule {}
