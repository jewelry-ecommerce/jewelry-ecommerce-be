import { BadRequestException } from '@nestjs/common';
import { CmsBlockType,CmsStatus } from './cms.enum';
import type { CmsPageInput } from './cms.interface';
export const CMS_POLICY={locale:'vi-VN',layoutId:'default',layoutName:'Default',targetDevice:'ALL'} as const;
export function validateCmsPage(page:CmsPageInput):void {
  if(page.status===CmsStatus.PUBLISHED && !page.blocks.some(block=>block.isVisible)) {
    throw invalid('CMS_VISIBLE_BLOCK_REQUIRED','Cần ít nhất một block hiển thị trước khi publish.');
  }
  const ids=page.blocks.flatMap(block=>block.id===undefined?[]:[block.id]);
  if(new Set(ids).size!==ids.length) throw invalid('CMS_BLOCK_DUPLICATE','ID block bị trùng.');
  for(const block of page.blocks) {
    if(block.blockTypeCode===CmsBlockType.BANNER && (typeof block.config.placementCode!=='string' || !block.config.placementCode.trim())) {
      throw invalid('CMS_PLACEMENT_REQUIRED','Block banner cần chọn vị trí hiển thị.');
    }
    validateConfigLinks(block.config);
  }
}
function validateConfigLinks(value:unknown):void {
  if(Array.isArray(value)) {value.forEach(validateConfigLinks);return;}
  if(typeof value!=='object' || value===null) return;
  for(const [key,child]of Object.entries(value)) {
    if(typeof child==='string' && /(?:url|href|target)$/i.test(key) && /^(?:javascript|vbscript|data):/i.test(child.replace(/[\s\u0000-\u001f]/g,''))) {
      throw invalid('CMS_UNSAFE_LINK','Đường dẫn cấu hình không an toàn.');
    }
    validateConfigLinks(child);
  }
}
function invalid(code:string,message:string):BadRequestException {return new BadRequestException({code,message});}
