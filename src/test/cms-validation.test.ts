import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCmsPage } from '../cms/domain/cms.validation';
import { CmsBlockType,CmsStatus } from '../cms/domain/cms.enum';
import type { CmsPageInput } from '../cms/domain/cms.interface';
const page=():CmsPageInput=>({name:'Page',slug:'page',status:CmsStatus.DRAFT,isActive:true,seo:{},blocks:[]});
test('new draft pages start empty',()=>{assert.doesNotThrow(()=>validateCmsPage(page()));});
test('publishing requires visible content',()=>{
  const input=page();input.status=CmsStatus.PUBLISHED;
  assert.throws(()=>validateCmsPage(input),/ít nhất một block/);
});
test('banner blocks require a placement code',()=>{
  const input=page();input.blocks=[{blockTypeCode:CmsBlockType.BANNER,sortOrder:0,isVisible:true,config:{}}];
  assert.throws(()=>validateCmsPage(input),/vị trí hiển thị/);
});
test('unsafe nested action URLs are rejected',()=>{
  const input=page();input.blocks=[{blockTypeCode:CmsBlockType.INFO_CARDS,sortOrder:0,isVisible:true,config:{items:[{actionUrl:'javascript:alert(1)'}]}}];
  assert.throws(()=>validateCmsPage(input),/không an toàn/);
});
