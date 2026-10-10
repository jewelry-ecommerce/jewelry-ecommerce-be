import type { DataSourceOptions } from 'typeorm';
import { applicationConfiguration } from '../config/application.config';
import { InitialSchema1791561600000 } from './migrations/1791561600000-initial-schema';
export function databaseOptions(environment: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  const { database } = applicationConfiguration(environment);
  if (!database.username || !database.password) throw new Error('Configure DB_USER and DB_PASSWORD for the separate backup database');
  return {
    type: 'postgres', host: database.host, port: database.port,
    database: database.name, username: database.username, password: database.password,
    ssl: database.ssl ? { rejectUnauthorized: true } : false,
    synchronize: false, migrationsRun: false, migrations: [InitialSchema1791561600000],
    migrationsTableName: 'jewelry_migrations', logging: ['error'],
  };
}
