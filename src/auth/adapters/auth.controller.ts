import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../application/auth.service';
import type { AuthenticatedRequest, AdminSession, AdminUser } from '../domain/auth.interface';
import { AdminGuard } from './admin.guard';
import { AdminLoginDto } from './login.dto';
@ApiTags('Admin account')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login')
  login(@Body() body: AdminLoginDto): Promise<AdminSession> {
    return this.auth.login(body.email, body.password);
  }
  @Get('me')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  me(@Req() request: AuthenticatedRequest): AdminUser {
    return request.principal!;
  }
}
