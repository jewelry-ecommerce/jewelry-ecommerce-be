
export enum ProductUnitOfMeasure {
  EACH='EACH',STRAND='STRAND',PAIR='PAIR',SET='SET',BOX='BOX',BAG='BAG',SHEET='SHEET',
}
export interface ProductMetadata {
  weight?:number;length?:number;width?:number;height?:number;productMixMatch?:number[];
}
export interface SkuMetadata {taxRateOverride?:number|null;b2bWholesalePriceAfterTax?:number|null}
export interface CategorySummary {
  id:number;name:string;code:string;slug:string;status:string;taxRate:number;parentId:number|null;level:number;
}
