import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.options';
async function migrate(): Promise<void> {
  ConfigModule.forRoot({ isGlobal: true });
  const source = new DataSource(databaseOptions());
  await source.initialize();
  try { await source.runMigrations({ transaction: 'all' }); }
  finally { await source.destroy(); }
}
void migrate().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? error.message + '\n' : 'Migration failed\n');
  process.exitCode = 1;
});
