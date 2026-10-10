import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProduct,validatePublish } from '../pim/domain/product.validation';
import { SkuStatus } from '../pim/domain/catalog.enum';
import type { ProductWriteInput } from '../pim/domain/product.interface';
const valid=():ProductWriteInput=>({
  spuCode:'TEST',name:'Product',categoryId:1,defaultSkuCode:'SKU-1',attributes:[{attributeId:1,valueIds:[10]}],
  skus:[{skuCode:'SKU-1',status:SkuStatus.ACTIVE,attributeValueIds:[10],medias:['http://localhost:8083/uploads/test.png'],sellingPriceAfterTaxMinor:100000}],
});
test('SKU values must come from the selected product attributes',()=>{
  const input=valid();input.skus[0]!.attributeValueIds=[99];
  assert.throws(()=>validateProduct(input),/chưa được chọn/);
});
test('representative SKU must belong to product',()=>{
  const input=valid();input.defaultSkuCode='OTHER';
  assert.throws(()=>validateProduct(input),/không thuộc/);
});
test('publish cannot silently use another SKU image',()=>{
  assert.throws(()=>validatePublish([
    {status:SkuStatus.ACTIVE,isDefault:true,hasMedia:false},
    {status:SkuStatus.ACTIVE,isDefault:false,hasMedia:true},
  ]),/phải đang hoạt động và có ảnh/);
});
test('a ready default SKU is publishable',()=>{
  assert.doesNotThrow(()=>validateProduct(valid()));
  assert.doesNotThrow(()=>validatePublish([{status:SkuStatus.ACTIVE,isDefault:true,hasMedia:true}]));
});
