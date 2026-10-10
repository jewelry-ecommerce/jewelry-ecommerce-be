
import { Injectable,NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../infrastructure/product.repository';
import { storefrontCard } from '../domain/storefront-product.mapper';
import type { StorefrontProductQuery,ProductCard } from '../domain/storefront-product.interface';
import { PRODUCT_QUERY_POLICY } from '../domain/product-query.interface';
import { storefrontDetail } from '../domain/storefront-detail.mapper';
import { ProductStatus } from '../domain/catalog.enum';
@Injectable()
export class StorefrontProductService {
  constructor(private readonly products:ProductRepository) {}
  async detail(slug:string) {
    const id=await this.products.publishedIdBySlug(slug);
    const aggregate=id===undefined?null:await this.products.aggregate(id);
    const detail=aggregate?.product.status===ProductStatus.PUBLISHED?storefrontDetail(aggregate):null;
    if(!detail) throw new NotFoundException({code:'PRODUCT_NOT_FOUND',message:'Không tìm thấy sản phẩm đã xuất bản.'});
    return detail;
  }
  async list(query:StorefrontProductQuery) {
    const records=await this.products.storefrontRows(query);
    const page=query.page??PRODUCT_QUERY_POLICY.firstPage,take=query.take??PRODUCT_QUERY_POLICY.defaultTake;
    const list:ProductCard[]=[];
    for(const record of records.slice((page-1)*take,page*take)) {
      const aggregate=await this.products.aggregate(record.id);
      const card=aggregate?storefrontCard(aggregate):null;
      if(card) list.push(card);
    }
    const hasNextPage=page*take<records.length,hasPreviousPage=page>1;
    return {total:records.length,list,pagination:{total:records.length,currentPage:page,
      nextPage:hasNextPage,previousPage:hasPreviousPage,hasNextPage,hasPreviousPage,totalPage:Math.ceil(records.length/take)}};
  }
}
