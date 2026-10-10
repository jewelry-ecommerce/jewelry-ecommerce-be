export enum SkuOrderDirection { ASC='ASC', DESC='DESC' }
export enum SkuOrderField { UPDATED_AT='updatedAt', SKU_CODE='skuCode' }
export const SKU_QUERY_POLICY={firstPage:1,defaultTake:20,maximumTake:100,maximumScopeIds:100} as const;
export interface SkuQuery {
  search?:string;page?:number;take?:number;categoryIds?:number[];collectionIds?:number[];
  orderBy?:SkuOrderField;orderType?:SkuOrderDirection;
}
export interface SkuPickerRow {
  id:number;skuCode:string;name:string;slug:string;image:string|null;stock:number;
  product:{id:number;name:string};medias:{url:string}[];
}
export interface SkuPickerPage {list:SkuPickerRow[];total:number;pagination:{
  page:number;take:number;itemCount:number;pageCount:number;hasNextPage:boolean;hasPreviousPage:boolean;
}}
