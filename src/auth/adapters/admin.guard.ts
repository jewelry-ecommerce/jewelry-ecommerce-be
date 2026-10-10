import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { AccountRole } from '../domain/auth.constants';
import type { AuthenticatedRequest } from '../domain/auth.interface';
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw this.expired();
    try { request.principal = await this.auth.authenticate(authorization.slice(7)); }
    catch { throw this.expired(); }
    if (![AccountRole.ADMIN, AccountRole.CATALOG_MANAGER, AccountRole.VIEWER].includes(request.principal.role)) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Không có quyền quản trị nội dung.' });
    }
    if (request.principal.role === AccountRole.VIEWER && request.method !== 'GET') {
      throw new ForbiddenException({ code: 'AUTH_READ_ONLY', message: 'Tài khoản chỉ được xem.' });
    }
    return true;
  }
  private expired(): UnauthorizedException {
    return new UnauthorizedException({ code: 'AUTH_SESSION_EXPIRED', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}
