import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { PermissionGuard } from '@modules/auth/guards/permission/permission.guard';
import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

export const PERMISSION_METADATA_KEY = 'required_permission';

export interface RequiredPermission {
  /** Permission module key, e.g. 'settings', 'users', 'branches', 'reports'. */
  module: string;
  /** Required action. Omit to infer from the HTTP verb (GET=read, POST=create…). */
  action?: PermissionsEnum;
}

/**
 * Gate a route (or whole controller) on a per-role permission grant. Placed on a
 * controller, every route inherits it and the action is inferred from the HTTP
 * verb; override per-route for finer control. Public routes are never gated.
 *
 *   @RequirePermission('settings')            // action inferred from the verb
 *   @RequirePermission('settings', PermissionsEnum.UPDATE)
 */
export function RequirePermission(module: string, action?: PermissionsEnum) {
  return applyDecorators(
    SetMetadata(PERMISSION_METADATA_KEY, {
      module,
      action,
    } as RequiredPermission),
    UseGuards(PermissionGuard),
  );
}
