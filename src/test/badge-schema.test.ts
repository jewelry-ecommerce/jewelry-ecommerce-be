import { test } from 'node:test';
import assert from 'node:assert/strict';
import { badgePatchSchema } from '../badge/domain/badge.schema';
import { badgeFlowPatchSchema,badgeRuleConfigSchema } from '../badge/domain/badge-flow.schema';
test('partial badge update never injects create defaults',()=>{
  assert.deepEqual(badgePatchSchema.parse({name:'Updated'}),{name:'Updated'});
  assert.deepEqual(badgeFlowPatchSchema.parse({name:'Updated'}),{name:'Updated'});
});
test('basic out-of-stock configuration never accepts an ignored custom threshold',()=>{
  assert.equal(badgeRuleConfigSchema.safeParse({minStock:1}).success,true);
  assert.equal(badgeRuleConfigSchema.safeParse({minStock:2}).success,false);
  assert.equal(badgeRuleConfigSchema.safeParse({minStock:0}).success,false);
});
