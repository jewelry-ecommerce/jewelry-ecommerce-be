import { Injectable } from '@nestjs/common';
import { SkuQueryRepository } from '../infrastructure/sku-query.repository';
import { SKU_QUERY_POLICY,type SkuQuery,type SkuPickerPage } from '../domain/sku-query.interface';
@Injectable()
export class SkuQueryService {
  constructor(private readonly repository:SkuQueryRepository) {}
  async list(query:SkuQuery):Promise<SkuPickerPage> {
    const page=query.page??SKU_QUERY_POLICY.firstPage,take=query.take??SKU_QUERY_POLICY.defaultTake;
    const result=await this.repository.list(query,page,take);
    const pageCount=Math.ceil(result.total/take);
    return {...result,pagination:{page,take,itemCount:result.total,pageCount,hasNextPage:page<pageCount,hasPreviousPage:page>1}};
  }
}
