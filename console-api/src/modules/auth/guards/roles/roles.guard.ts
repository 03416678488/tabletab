import { ACCESS_METADATA_KEY } from '@cor/decorators/authorization/authorization.decorator';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

interface RequiredRole {
  name: string;
  permissions: { resource: string; actions: string };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as
      | AuthenticatedUser
      | undefined;

    if (!user) return false;

    // Admins / super admins administer the system — always allowed.
    if (user.isSuperAdmin) return true;

    const metadata = this.reflector.getAllAndOverride<{ roles?: RequiredRole[] }>(
      ACCESS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles = Array.isArray(metadata?.roles) ? metadata.roles : [];
    if (requiredRoles.length === 0) return true;

    const roles = user.roles ?? {};

    return requiredRoles.some((required) => {
      const resourceActions = roles[required.name]?.[required.permissions.resource];
      return Array.isArray(resourceActions)
        ? resourceActions.includes(required.permissions.actions)
        : false;
    });
  }
}
