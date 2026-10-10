import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { AccountRecord } from '../domain/auth.interface';
@Injectable()
export class AccountRepository {
  constructor(private readonly source: DataSource) {}
  async findByEmail(email: string): Promise<AccountRecord | null> {
    const records = await this.source.query<AccountRecord[]>(
      'SELECT id,email,name,password_hash,role,status FROM accounts WHERE lower(email)=$1 AND deleted_at IS NULL',
      [email.trim().toLowerCase()],
    );
    return records[0] ?? null;
  }
  async findById(id: number): Promise<AccountRecord | null> {
    const records = await this.source.query<AccountRecord[]>(
      'SELECT id,email,name,password_hash,role,status FROM accounts WHERE id=$1 AND deleted_at IS NULL', [id],
    );
    return records[0] ?? null;
  }
}
