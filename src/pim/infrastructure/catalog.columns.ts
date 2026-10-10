import type { CatalogResource } from '../domain/catalog.interface';
export const CATALOG_COLUMNS = {
  categories: {
    name: 'name', code: 'code', slug: 'slug', parentId: 'parent_id', status: 'status',
    isDisplay: 'is_display', taxRate: 'tax_rate', logo: 'logo', image: 'image',
  },
  attributes: { name: 'name', code: 'code', displayType: 'display_type', status: 'status', isVariantAxis: 'is_variant_axis' },
  collections: { name: 'name', slug: 'slug', description: 'description', image: 'image', status: 'status' },
} satisfies Record<CatalogResource, Record<string, string>>;
export const CATALOG_SELECT = {
  categories: 'id,name,code,slug,status,parent_id AS "parentId",is_display AS "isDisplay",tax_rate::float AS "taxRate",logo,image,seo,sort_order AS "sortOrder"',
  attributes: 'id,name,code,status,display_type AS "displayType",is_variant_axis AS "isVariantAxis"',
  collections: 'id,name,slug,status,description,image',
} satisfies Record<CatalogResource, string>;
export const CATALOG_AUDIT_SELECT = 'created_at AS "createdAt",updated_at AS "updatedAt"';
