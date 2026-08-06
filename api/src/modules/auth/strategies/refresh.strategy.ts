import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthJwtPayload } from '../types';
import { RefreshSessionClaims } from '../types/auth-jwtPayload';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(private readonly _configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: _configService.get<string>('REFRESH_JWT_SECRET'),
    });
  }

  validate(payload: AuthJwtPayload & Partial<RefreshSessionClaims> & { iat?: number }) {
    return {
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      tenant: payload.tenant ?? null,
      // Session-rotation claims, consumed by AuthService.refreshToken/logout.
      sid: payload.sid,
      jti: payload.jti,
      iat: payload.iat,
    };
  }
}
