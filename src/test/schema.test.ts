import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const schema = readFileSync(join(__dirname, '..', 'database', 'migrations', 'initial-schema.sql'), 'utf8');
test('schema defines numeric generated IDs and contains no business seeds', () => {
  const tables = schema.match(/CREATE TABLE /g) ?? [];
  const identifiers = schema.match(/id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY/g) ?? [];
  assert.equal(tables.length, 30);
  assert.equal(identifiers.length, tables.length);
  assert.doesNotMatch(schema, /INSERT INTO|DROP TABLE|DROP DATABASE/i);
});
test('schema enforces variant ownership and attribute/value ownership', () => {
  assert.match(schema, /FOREIGN KEY\(default_variation_id,id\) REFERENCES product_variations\(id,product_id\)/);
  assert.match(schema, /FOREIGN KEY\(value_id,attribute_id\) REFERENCES attribute_values\(id,attribute_id\)/);
  assert.match(schema, /FOREIGN KEY\(variation_id,product_id\) REFERENCES product_variations\(id,product_id\)/);
});
test('schema stores independent slot geometry and visible block state', () => {
  assert.match(schema, /CREATE TABLE banner_layout_items/);
  assert.match(schema, /display_metadata jsonb NOT NULL/);
  assert.match(schema, /is_visible boolean NOT NULL DEFAULT true/);
  assert.match(schema, /placement_one_active_layout/);
});
test('schema limits money to safe integer VND and ratings to 1..5', () => {
  assert.match(schema, /selling_price_minor>=0 AND selling_price_minor<=9007199254740991/);
  assert.match(schema, /rating BETWEEN 1 AND 5/);
});
