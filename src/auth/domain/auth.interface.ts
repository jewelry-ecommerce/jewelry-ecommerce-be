import type { Request } from 'express';
import type { AccountRole } from './auth.constants';
export interface AccountRecord {
  id: number; email: string; name: string; password_hash: string; role: AccountRole; status: string;
}
export interface AdminUser {
  id: number; email: string; displayName: string; role: AccountRole;
  avatar: null; jobTitle: string; lastLoginAt: string | null;
}
export interface AuthClaims { sub: number; role: AccountRole }
export interface AuthenticatedRequest extends Request { principal?: AdminUser }
export interface AdminSession { user: AdminUser; accessToken: string; issuedAt: string }
