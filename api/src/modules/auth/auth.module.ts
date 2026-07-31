import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
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
import { User } from '@modules/user/entities/users.entity';
import { RefreshStrategy } from './strategies/refresh.strategy';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
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
  providers: [RateLimitService, AuthService, LocalStrategy, JwtStrategy, RefreshStrategy],
  exports: [PassportModule, AuthService, JwtStrategy],
})
export class AuthModule {}
