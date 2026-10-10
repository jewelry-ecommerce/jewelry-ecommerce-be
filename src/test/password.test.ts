import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../auth/domain/password.util';
test('password hashes verify correct passwords without storing plaintext', () => {
  const encoded = hashPassword('local-test-password');
  assert.equal(verifyPassword('local-test-password', encoded), true);
  assert.equal(verifyPassword('wrong-password', encoded), false);
  assert.equal(encoded.includes('local-test-password'), false);
});
test('each password gets its own random salt', () => {
  assert.notEqual(hashPassword('same-password'), hashPassword('same-password'));
});
test('malformed password hashes are rejected', () => {
  assert.equal(verifyPassword('password', 'invalid'), false);
  assert.equal(verifyPassword('password', 'scrypt-v1:salt:ff'), false);
});
