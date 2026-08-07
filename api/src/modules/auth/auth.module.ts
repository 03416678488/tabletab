import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '@modules/user/user.module';
import refreshJwtConfig from './config/refresh-jwt.config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '@modules/mail/mail.module';
import { RateLimitService } from './services/rate-limit.service';
import { RefreshTokenStoreService } from './services/refresh-token-store.service';
import { User } from '@modules/user/entities/users.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { RolePermission } from '@modules/role-permission/entities/role-permission.entity';
import { RefreshStrategy } from './strategies/refresh.strategy';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([User, UserRolePermissions, RolePermission]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
            '15m',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    UserModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    RateLimitService,
    RefreshTokenStoreService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshStrategy,
  ],
  // RateLimitService is exported so other modules (e.g. customer auth) can use
  // the @RateLimit decorator, whose interceptor injects it.
  exports: [PassportModule, AuthService, JwtStrategy, RateLimitService],
})
export class AuthModule {}
