import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_POLICY } from '../domain/auth.constants';
import type { AccountRecord, AdminSession, AdminUser, AuthClaims } from '../domain/auth.interface';
import { verifyPassword } from '../domain/password.util';
import { AccountRepository } from '../infrastructure/account.repository';
@Injectable()
export class AuthService {
  constructor(private readonly accounts: AccountRepository, private readonly jwt: JwtService) {}
  async login(email: string, password: string): Promise<AdminSession> {
    const account = await this.accounts.findByEmail(email);
    if (!account || account.status !== AUTH_POLICY.activeStatus || !verifyPassword(password, account.password_hash)) {
      throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' });
    }
    return { user: this.toUser(account), accessToken: await this.jwt.signAsync({ sub: account.id, role: account.role }), issuedAt: new Date().toISOString() };
  }
  async authenticate(token: string): Promise<AdminUser> {
    const claims = await this.jwt.verifyAsync<AuthClaims>(token);
    if (!Number.isSafeInteger(claims.sub) || claims.sub <= 0) throw new UnauthorizedException();
    const account = await this.accounts.findById(claims.sub);
    if (!account || account.status !== AUTH_POLICY.activeStatus) throw new UnauthorizedException();
    return this.toUser(account);
  }
  private toUser(account: AccountRecord): AdminUser {
    return {
      id: account.id, email: account.email, displayName: account.name, role: account.role,
      avatar: null, jobTitle: account.role, lastLoginAt: null,
    };
  }
}
