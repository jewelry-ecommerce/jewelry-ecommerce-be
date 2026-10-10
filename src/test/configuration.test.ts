import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applicationConfiguration } from '../config/application.config';
import { databaseOptions } from '../database/database.options';

test('configuration isolates the backup database and normalizes prefix', () => {
  const config = applicationConfiguration({ DB_PORT: '5433', API_PREFIX: '/api/v1/', CORS_ORIGINS: 'http://localhost:6100, http://localhost:3100' });
  assert.equal(config.database.name, 'jewelry_commerce');
  assert.equal(config.database.port, 5433);
  assert.equal(config.apiPrefix, 'api/v1');
  assert.deepEqual(config.corsOrigins, ['http://localhost:6100', 'http://localhost:3100']);
});
test('configuration rejects invalid ports', () => {
  for (const value of ['not-a-port', '0', '65536', '5432.5']) {
    assert.throws(() => applicationConfiguration({ DB_PORT: value }), /Invalid configured port/);
  }
});
test('database cannot connect with missing credentials', () => {
  assert.throws(() => databaseOptions({ DB_USER: 'postgres' }), /Configure DB_USER and DB_PASSWORD/);
});
test('database configuration never silently synchronizes or seeds', () => {
  const options = databaseOptions({ DB_USER: 'private-user', DB_PASSWORD: 'test-only', DB_PORT: '5433' });
  assert.equal(options.type, 'postgres');
  assert.equal(options.synchronize, false);
  assert.equal(options.migrationsRun, false);
  assert.equal(options.migrationsTableName, 'jewelry_migrations');
});
