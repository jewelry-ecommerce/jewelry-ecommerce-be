import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageType } from '../media/domain/media.validation';
import { MEDIA_POLICY } from '../media/domain/media.config';
test('image uploads check binary content rather than trusting filename',()=>{
  assert.equal(imageType(Buffer.from([137,80,78,71,13,10,26,10])).mime,'image/png');
  assert.throws(()=>imageType(Buffer.from('<html><script>alert(1)</script></html>')),/hỗ trợ/);
});
test('upload size and traversal keys are rejected',()=>{
  assert.throws(()=>imageType(Buffer.alloc(MEDIA_POLICY.maximumBytes+1)),/dung lượng/);
  assert.equal(MEDIA_POLICY.keyPattern.test('../.env'),false);
  assert.equal(MEDIA_POLICY.keyPattern.test('a'.repeat(48)+'.png'),true);
});
