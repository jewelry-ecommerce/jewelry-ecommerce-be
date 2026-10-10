
import { Injectable } from '@nestjs/common';
import { CatalogRepository } from '../infrastructure/catalog.repository';
import { CatalogStatus } from '../domain/catalog.enum';
import { buildSkuMatrix,validateMatrixInput } from '../domain/sku-matrix.util';
import type { MatrixInput, MatrixView, MatrixValue } from '../domain/sku-matrix.interface';
@Injectable()
export class SkuMatrixService {
  constructor(private readonly catalog:CatalogRepository) {}
  async preview(input:MatrixInput):Promise<MatrixView> {
    validateMatrixInput(input);
    const ids=new Set(input.attributes.map(axis=>axis.attributeId));
    const attributes=(await this.catalog.list('attributes')).filter(attribute=>ids.has(attribute.id)&&attribute.status===CatalogStatus.ACTIVE)
      .map(attribute=>({id:attribute.id,name:attribute.name,code:attribute.code??''}));
    const values:MatrixValue[]=[];
    for(const attribute of attributes) {
      const selected=new Set(input.attributes.find(axis=>axis.attributeId===attribute.id)!.valueIds);
      values.push(...(await this.catalog.values(attribute.id)).filter(value=>selected.has(value.id))
        .map(value=>({id:value.id,attributeId:attribute.id,name:value.value,code:value.code,image:value.image})));
    }
    return buildSkuMatrix(input,attributes,values);
  }
}
