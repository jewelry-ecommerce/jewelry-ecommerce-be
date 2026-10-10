
import type { ProductStatus } from './catalog.enum';
export interface ProductQuery { search?:string;status?:ProductStatus;categoryId?:number;page?:number;take?:number;productIds?:number[] }
export const PRODUCT_QUERY_POLICY = { firstPage:1, defaultTake:20, maximumTake:100 } as const;
