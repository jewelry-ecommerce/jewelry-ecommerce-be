import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_POLICY } from './domain/auth.constants';
import { AuthController } from './adapters/auth.controller';
import { AdminGuard } from './adapters/admin.guard';
import { AuthService } from './application/auth.service';
import { AccountRepository } from './infrastructure/account.repository';
function tokenOptions(configuration: ConfigService) {
  const secret = configuration.get<string>('AUTH_SECRET') || '';
  if (secret.length < AUTH_POLICY.minimumSecretLength) throw new Error('AUTH_SECRET must contain at least 32 characters');
  return {
    secret,
    signOptions: { algorithm: AUTH_POLICY.algorithm, expiresIn: AUTH_POLICY.tokenLifetimeSeconds, issuer: AUTH_POLICY.issuer, audience: AUTH_POLICY.audience },
    verifyOptions: { algorithms: [AUTH_POLICY.algorithm], issuer: AUTH_POLICY.issuer, audience: AUTH_POLICY.audience },
  };
}
@Global()
@Module({
  imports: [JwtModule.registerAsync({ inject: [ConfigService], useFactory: tokenOptions })],
  controllers: [AuthController],
  providers: [AuthService, AccountRepository, AdminGuard],
  exports: [AuthService, AdminGuard],
})
export class AuthModule {}
