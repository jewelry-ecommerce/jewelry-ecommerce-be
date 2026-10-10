import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../infrastructure/product.repository';
import { productView } from '../domain/product.mapper';
import { validateProduct,validatePublish } from '../domain/product.validation';
import { ProductStatus } from '../domain/catalog.enum';
import type { ProductView,ProductWriteInput } from '../domain/product.interface';
import { slugify } from '../domain/catalog.validation';
import { PRODUCT_QUERY_POLICY, type ProductQuery } from '../domain/product-query.interface';
import { productCounts, type ProductCounts } from '../domain/product-counts.util';
@Injectable()
export class ProductService {
  constructor(private readonly products:ProductRepository) {}
  async list(query:ProductQuery={}):Promise<{total:number;list:ProductView[];counts:ProductCounts;pagination:{hasNextPage:boolean;page:number;take:number}}> {
    const search=query.search?.trim().toLowerCase();
    const matching = (await this.products.list()).filter(product=>
      (!query.categoryId || product.category_id===query.categoryId)
      && (!query.productIds || query.productIds.includes(product.id))
      && (!search || (product.name+" "+product.spu_code).toLowerCase().includes(search)));
    const records=matching.filter(product=>!query.status || product.status===query.status);
    const page=query.page??PRODUCT_QUERY_POLICY.firstPage,take=query.take??PRODUCT_QUERY_POLICY.defaultTake;
    const list = await Promise.all(records.slice((page-1)*take,page*take).map(record => this.detail(record.id)));
    return {total:records.length,list,counts:productCounts(matching),pagination:{page,take,hasNextPage:page*take<records.length}};
  }
  async detail(id:number):Promise<ProductView> {
    const aggregate = await this.products.aggregate(id);
    if (!aggregate) throw new NotFoundException({code:'PRODUCT_NOT_FOUND',message:'Không tìm thấy sản phẩm.'});
    return productView(aggregate);
  }
  async create(input:ProductWriteInput):Promise<ProductView> {
    validateProduct(input);
    const slug = slugify(input.slug || input.name);
    if (!slug) throw new BadRequestException({code:'PRODUCT_SLUG_INVALID',message:'Tên/đường dẫn sản phẩm không hợp lệ.'});
    try { return this.detail(await this.products.create(input,slug)); }
    catch(error) {
      if (typeof error==='object' && error!==null && 'code' in error && error.code==='23505') {
        throw new ConflictException({code:'PRODUCT_DUPLICATE_CODE',message:'Mã sản phẩm, SKU hoặc đường dẫn đã tồn tại.'});
      }
      if (error instanceof Error && error.message.startsWith('PRODUCT_')) {
        throw new BadRequestException({code:error.message,message:'Danh mục hoặc giá trị thuộc tính không hợp lệ.'});
      }
      throw error;
    }
  }
  async update(id:number,input:ProductWriteInput):Promise<ProductView> {
    const current=await this.detail(id);
    validateProduct(input);
    const slug=slugify(input.slug||current.slug);
    if(current.status===ProductStatus.PUBLISHED) validatePublish(input.skus.map(sku=>({
      status:sku.status,isDefault:sku.skuCode.trim().toUpperCase()===input.defaultSkuCode.trim().toUpperCase(),hasMedia:sku.medias.length>0,
    })));
    try {await this.products.update(id,input,slug);return this.detail(id);}
    catch(error) {throw this.writeError(error);}
  }
  private writeError(error:unknown):unknown {
    if(typeof error==='object' && error!==null && 'code' in error && error.code==='23505') {
      return new ConflictException({code:'PRODUCT_DUPLICATE_CODE',message:'Mã sản phẩm, SKU hoặc đường dẫn đã tồn tại.'});
    }
    if(error instanceof Error && error.message.startsWith('PRODUCT_')) {
      return new BadRequestException({code:error.message,message:'SKU, tồn kho hoặc giá trị thuộc tính không hợp lệ.'});
    }
    return error;
  }
  async status(id:number,status:ProductStatus):Promise<ProductView> {
    const aggregate = await this.products.aggregate(id);
    if (!aggregate) throw new NotFoundException({code:'PRODUCT_NOT_FOUND',message:'Không tìm thấy sản phẩm.'});
    if (status===ProductStatus.PUBLISHED) validatePublish(aggregate.skus.map(sku => ({
      status:sku.status,isDefault:sku.id===aggregate.product.default_variation_id,
      hasMedia:aggregate.media.some(image => image.variation_id===sku.id),
    })));
    await this.products.setStatus(id,status);
    return this.detail(id);
  }
}
