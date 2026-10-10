import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from '../../database/database.options';
import { AccountRole, AUTH_POLICY } from '../domain/auth.constants';
import { hashPassword } from '../domain/password.util';
async function provisionAdmin(): Promise<void> {
  ConfigModule.forRoot({ isGlobal: true });
  const email = process.env.PROVISION_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  const name = process.env.PROVISION_ADMIN_NAME?.trim();
  if (!email || !name || !password || password.length < 12) throw new Error('Set PROVISION_ADMIN_EMAIL/NAME and a password of at least 12 characters');
  const source = await new DataSource(databaseOptions()).initialize();
  try {
    await source.query('INSERT INTO accounts(email,name,password_hash,role,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING',
      [email, name, hashPassword(password), AccountRole.ADMIN, AUTH_POLICY.activeStatus]);
  } finally { await source.destroy(); }
}
void provisionAdmin().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? error.message + '\n' : 'Provision failed\n');
  process.exitCode = 1;
});
