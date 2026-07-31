import { ACCESS_METADATA_KEY } from '@cor/decorators/authorization/authorization.decorator';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    const metadata = this.reflector.getAllAndOverride<{ roles?: object }>(ACCESS_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    let isAuthorized = false;
    const requiredRoles = Array.isArray(metadata.roles) ? metadata.roles : [];

    isAuthorized = Object.keys(user.roles).some((userRole) => {
      return requiredRoles.some((requiredRole) => {
        if (userRole === requiredRole.name) {
          const { resource, actions: requiredPermission } = requiredRole.permissions;
          const userPermissions = user.roles[userRole][resource];
          return userPermissions.includes(requiredPermission);
        }
        return false;
      });
    });

    return isAuthorized;
  }
}
