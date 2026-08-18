import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '@modules/auth/guards/public/public.decorator';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';
import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';
import {
  PERMISSION_METADATA_KEY,
  RequiredPermission,
} from '@cor/decorators/authorization/require-permission.decorator';

/** HTTP verb → the permission action it implies when none is declared. */
function actionForMethod(method: string): PermissionsEnum {
  switch (method.toUpperCase()) {
    case 'POST':
      return PermissionsEnum.CREATE;
    case 'PUT':
    case 'PATCH':
      return PermissionsEnum.UPDATE;
    case 'DELETE':
      return PermissionsEnum.DELETE;
    default:
      return PermissionsEnum.READ; // GET / HEAD / OPTIONS
  }
}

/**
 * Enforces the per-role permission grants (from the Roles & Permissions manager)
 * on a route declared with `@RequirePermission(module, action?)`.
 *
 * Grant-driven for EVERY role — including the Owner. `isSuperAdmin` still governs
 * business logic elsewhere (branch scoping, payment overrides) but must never
 * bypass authorization here, or unchecking a module for the Owner would do
 * nothing. The Owner is seeded with full grants and is protected from removing
 * its own `settings` access, so this can never lock the Owner out.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Public routes are never gated (guests have no grants).
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');

    const action = required.action ?? actionForMethod(req.method);

    // Allow if ANY of the user's roles grants this module + action.
    const roleGrants = user.roles ?? {};
    for (const perResource of Object.values(roleGrants)) {
      const actions = perResource?.[required.module];
      if (Array.isArray(actions) && actions.includes(action)) return true;
    }

    throw new ForbiddenException(
      `Missing permission: ${required.module}:${action}`,
    );
  }
}
