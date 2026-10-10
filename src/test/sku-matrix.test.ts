
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSkuMatrix } from '../pim/domain/sku-matrix.util';
const input={attributes:[{attributeId:1,valueIds:[10,11]},{attributeId:2,valueIds:[20,21]}]};
const attributes=[{id:1,name:'Size',code:'SIZE'},{id:2,name:'Color',code:'COLOR'}];
const values=[{id:10,attributeId:1,name:'S',code:'S'},{id:11,attributeId:1,name:'M',code:'M'},
  {id:20,attributeId:2,name:'Silver',code:'SILVER'},{id:21,attributeId:2,name:'Gold',code:'GOLD'}];
test('matrix preserves chosen axis order and builds four unique SKU leaves',()=>{
  const result=buildSkuMatrix(input,attributes,values);
  assert.deepEqual(result.attributeOrder,[1,2]);
  assert.deepEqual(result.matrix.flatMap(node=>node.children.map(child=>child.canonicalKey)),['1:10|2:20','1:10|2:21','1:11|2:20','1:11|2:21']);
});
test('matrix refuses a value from another attribute',()=>{
  assert.throws(()=>buildSkuMatrix({attributes:[{attributeId:1,valueIds:[20]}]},attributes,values),/không thuộc/);
});
