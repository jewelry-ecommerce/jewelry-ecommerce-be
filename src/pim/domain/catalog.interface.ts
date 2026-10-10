import type { AttributeDisplayType, CatalogStatus } from './catalog.enum';
export type CatalogResource = 'categories' | 'attributes' | 'collections';
export interface CatalogInput {
  name: string; code?: string; slug?: string; status: CatalogStatus; displayType?: AttributeDisplayType;
  parentId?: number | null; isDisplay?: boolean; taxRate?: number; logo?: string; image?: string;
  description?: string; isVariantAxis?: boolean; directAttributeIds?: number[]; productIds?: number[];
  metaTitle?: string; metaDescription?: string; metaKeywords?: string;
}
export interface CatalogRecord extends Record<string, unknown> {
  id: number; name: string; code?: string; slug?: string; parentId?: number | null;
  status: string; createdAt: Date; updatedAt: Date; values?: AttributeValueRecord[];
  directAttributeIds?: number[]; productIds?: number[];
}
export interface AttributeValueInput { value: string; code: string; image?: string }
export interface AttributeValueRecord extends AttributeValueInput { id: number; attributeId: number }
export interface CatalogWriteInput extends CatalogInput { values?: AttributeValueInput[] }
export interface Pagination { page: number; take: number; itemCount: number; pageCount: number; hasNextPage: boolean; hasPreviousPage: boolean }
export interface CatalogList { total: number; list: CatalogRecord[]; pagination: Pagination }
export interface CatalogQuery { search?: string; page?: number; take?: number; status?: CatalogStatus }
