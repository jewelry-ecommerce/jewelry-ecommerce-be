import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CatalogRepository } from '../infrastructure/catalog.repository';
import { ProductService } from './product.service';
import type { CatalogList, CatalogRecord, CatalogResource, CatalogWriteInput, CatalogQuery } from '../domain/catalog.interface';
import { slugify, validateCatalogInput, validateParent } from '../domain/catalog.validation';
import { buildCategoryViews, categoryRoots, type CategoryView } from '../domain/category-tree.util';
@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository, private readonly products:ProductService) {}
  async list(resource: CatalogResource, query: CatalogQuery): Promise<CatalogList> {
    const records = await this.repository.list(resource);
    const matched = records.filter(record => (!query.status || record.status === query.status)
      && (!query.search || (record.name+' '+(record.code ?? '')).toLowerCase().includes(query.search.toLowerCase())));
    const page = query.page ?? 1, take = query.take ?? 20;
    const list = await Promise.all(matched.slice((page-1)*take,page*take).map(record => this.enrich(resource,record)));
    return { total: matched.length, list, pagination: {
      page,take,itemCount: matched.length,pageCount: Math.ceil(matched.length/take),
      hasNextPage: page*take < matched.length,hasPreviousPage: page>1,
    }};
  }
  async detail(resource: CatalogResource, id: number): Promise<CatalogRecord> {
    if(resource === "categories") {
      const category = (await this.categoryDetails()).find(record=>record.id===id);
      if(!category) throw new NotFoundException({code:"CATALOG_NOT_FOUND",message:"Không tìm thấy danh mục."});
      return category;
    }
    const record = (await this.repository.list(resource)).find(value => value.id === id);
    if (!record) throw new NotFoundException({ code: 'CATALOG_NOT_FOUND', message: 'Không tìm thấy bản ghi.' });
    return this.enrich(resource,record);
  }
  async write(resource: CatalogResource, input: CatalogWriteInput, id?: number): Promise<CatalogRecord> {
    validateCatalogInput(resource,input);
    if (id !== undefined) await this.detail(resource,id);
    if(resource==="attributes" && id!==undefined && input.values) {
      const dependencies=await this.repository.omittedValueDependencies(id,input.values.map(value=>value.code));
      if(dependencies.length) throw new ConflictException({code:"ATTRIBUTE_VALUE_IN_USE",message:"Giá trị thuộc tính đang được SKU sử dụng.",dependencies});
    }
    const records = await this.repository.list(resource);
    if (resource === 'categories') validateParent(records,id,input.parentId);
    try {
      const payload = resource === 'attributes' ? input : { ...input, slug: slugify(input.slug || input.name) };
      return await this.detail(resource,await this.repository.write(resource,payload,id));
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException({ code: 'CATALOG_DUPLICATE', message: 'Mã hoặc đường dẫn đã tồn tại.' });
      throw error;
    }
  }
  async delete(resource: CatalogResource, id: number): Promise<{ success: boolean }> {
    await this.detail(resource,id);
    const dependencies=await this.repository.dependencies(resource,id);
    if(dependencies.length) {
      const code=resource==="categories"?"CATEGORY_IN_USE":resource==="collections"?"COLLECTION_IN_USE":"ATTRIBUTE_IN_USE";
      throw new ConflictException({code,message:"Bản ghi đang được sử dụng. Gỡ liên kết trước khi xóa.",dependencies});
    }
    await this.repository.delete(resource,id);
    return { success: true };
  }
  async categoryTree(status?:string):Promise<CategoryView[]> {
    const roots=categoryRoots(await this.categoryDetails());
    const filter=(nodes:CategoryView[]):CategoryView[]=>nodes
      .filter(node=>!status || node.status===status)
      .map(node=>({...node,children:filter(node.children)}));
    return filter(roots);
  }
  private async categoryDetails():Promise<CategoryView[]> {
    const categories=await Promise.all((await this.repository.list('categories')).map(record=>this.enrich('categories',record)));
    const attributes=await Promise.all((await this.repository.list('attributes')).map(record=>this.enrich('attributes',record)));
    return buildCategoryViews(categories,attributes);
  }
  private async enrich(resource: CatalogResource, record: CatalogRecord): Promise<CatalogRecord> {
    if (resource === 'attributes') return { ...record, values: await this.repository.values(record.id) };
    const ids = await this.repository.relationIds(resource,record.id);
    if (resource === 'collections') {
      const items=await this.repository.collectionItems(record.id);
      const productCollections=await Promise.all(items.map(async item=>({...item,product:await this.products.detail(item.productId)})));
      return { ...record, productIds: ids, productCount: ids.length, productCollections };
    }
    const seo = record.seo && typeof record.seo === 'object' ? record.seo : {};
    return { ...record,directAttributeIds: ids,metaTitle: 'title' in seo ? seo.title : null,
      metaDescription: 'description' in seo ? seo.description : null,metaKeywords: 'keywords' in seo ? seo.keywords : null };
  }
  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
