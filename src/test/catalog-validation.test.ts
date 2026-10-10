import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, validateParent, validateCatalogInput } from '../pim/domain/catalog.validation';
import { AttributeDisplayType, CatalogStatus } from '../pim/domain/catalog.enum';
import type { CatalogRecord } from '../pim/domain/catalog.interface';
const record = (id: number,parentId: number | null): CatalogRecord => ({
  id,parentId,name:'Category',status:'ACTIVE',createdAt:new Date(),updatedAt:new Date(),
});
test('Vietnamese slugs preserve readable product/category names', () => {
  assert.equal(slugify('  Nhẫn Đính Đá!  '), 'nhan-dinh-da');
});
test('category parents reject cycles and missing references', () => {
  assert.throws(() => validateParent([record(1,null),record(2,1)],1,2), /vòng lặp/);
  assert.throws(() => validateParent([record(1,null)],2,99), /không tồn tại/);
  assert.doesNotThrow(() => validateParent([record(1,null)],2,1));
});
test('attribute values reject duplicate business codes', () => {
  assert.throws(() => validateCatalogInput('attributes',{
    name:'Size',code:'size',status:CatalogStatus.ACTIVE,displayType:AttributeDisplayType.TEXT,
    values:[{code:'S',value:'Small'},{code:'s',value:'Small duplicate'}],
  }), /bị trùng/);
});
