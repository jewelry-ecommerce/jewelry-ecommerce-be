
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCategoryViews, categoryRoots } from '../pim/domain/category-tree.util';
import type { CatalogRecord } from '../pim/domain/catalog.interface';
const row=(id:number,parentId:number|null,ids:number[]):CatalogRecord=>({
  id,parentId,name:'Category '+id,status:'ACTIVE',directAttributeIds:ids,createdAt:new Date(),updatedAt:new Date(),
});
test('category tree inherits parent attributes without duplicates',()=>{
  const categories=[row(1,null,[10]),row(2,1,[10,20]),row(3,2,[])];
  const attributes=[row(10,null,[]),row(20,null,[])];
  const views=buildCategoryViews(categories,attributes);
  assert.deepEqual(views[2]!.effectiveAttributes.map(attribute=>attribute.id),[10,20]);
  assert.equal(views[2]!.level,3);
  const roots=categoryRoots(views);
  assert.equal(roots.length,1);
  assert.equal(roots[0]!.children[0]!.children[0]!.id,3);
});
test('category tree rejects cycles rather than looping',()=>{
  assert.throws(()=>buildCategoryViews([row(1,2,[]),row(2,1,[])],[]),/Danh mục có vòng lặp/);
});
