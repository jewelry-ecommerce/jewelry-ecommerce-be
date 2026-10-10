import type { CmsBlockType,CmsStatus } from './cms.enum';
export interface CmsBlockInput {
  id?:number;blockTypeCode:CmsBlockType;sortOrder:number;isVisible:boolean;config:Record<string,unknown>;
}
export interface CmsPageInput {
  name:string;slug:string;locale?:string;status:CmsStatus;isActive:boolean;revision?:number;
  seo:Record<string,unknown>;blocks:CmsBlockInput[];
}
export interface CmsPageRow {
  id:number;name:string;slug:string;locale:string;status:CmsStatus;is_active:boolean;revision:number;seo:Record<string,unknown>;
}
export interface CmsBlockRow {id:number;page_id:number;block_type_code:CmsBlockType;sort_order:number;is_visible:boolean;config:Record<string,unknown>}
export interface CmsPage extends CmsPageInput {id:number;locale:string;revision:number;blocks:(CmsBlockInput&{id:number})[]}
export interface StorefrontPage {
  page:{id:number;name:string;slug:string;locale:string;seo:Record<string,unknown>};
  layout:{id:string;name:string;targetDevice:string;versionId:string;versionName:string};
  blocks:(CmsBlockInput&{id:number})[];
}
