import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';
import { TenantRequest } from '@modules/tenancy/tenancy.types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // passReqToCallback so we can read the tenant the request resolved to
    // (set by the tenant middleware from Host / x-tenant-* headers).
    super({ usernameField: 'email', passReqToCallback: true });
  }

  validate(req: TenantRequest, email: string, password: string) {
    return this.authService.validateUser(email, password, req.tenantDataSource);
  }
}
