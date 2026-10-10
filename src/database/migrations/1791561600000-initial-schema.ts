import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MigrationInterface, QueryRunner } from 'typeorm';
export class InitialSchema1791561600000 implements MigrationInterface {
  readonly name = 'InitialSchema1791561600000';
  async up(queryRunner: QueryRunner): Promise<void> {
    const sql = await readFile(join(__dirname, 'initial-schema.sql'), 'utf8');
    await queryRunner.query(sql);
  }
  async down(): Promise<void> {
    throw new Error('Destructive rollback is disabled. Restore an explicitly approved database backup.');
  }
}
