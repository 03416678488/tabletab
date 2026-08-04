import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

/**
 * Platform-console gate. Runs after the global JwtAuthGuard (which populates
 * `req.user`), and only lets **platform administrators** through — i.e. users
 * whose role makes them a super admin. Everyone else is forbidden.
 *
 * In the control plane, "platform admin" == super admin: the people who operate
 * the SaaS and manage tenants, distinct from a restaurant's own staff.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as
      | AuthenticatedUser
      | undefined;

    if (!user) throw new UnauthorizedException('Authentication required');
    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Platform administrator access required');
    }
    return true;
  }
}
