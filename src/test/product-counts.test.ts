
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { productCounts } from '../pim/domain/product-counts.util';
import { ProductStatus } from '../pim/domain/catalog.enum';
test('product counts reflect persisted status without enabling approvals',()=>{
  const counts=productCounts([{status:ProductStatus.DRAFT},{status:ProductStatus.PUBLISHED},{status:ProductStatus.PUBLISHED}]);
  assert.equal(counts.all,3);assert.equal(counts.draft,1);assert.equal(counts.published,2);
  assert.equal(counts.unpublished,0);assert.equal(counts.hasPendingApproval,0);
});
