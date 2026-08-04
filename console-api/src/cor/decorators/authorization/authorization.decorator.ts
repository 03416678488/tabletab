import { RolesGuard } from '@modules/auth/guards/roles/roles.guard';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

export const ACCESS_METADATA_KEY = 'access_control';

/**
 * Configure access control settings for a route.
 *
 * @param roles - Roles allowed accessing the route.
 * @param permissions - Permissions required to access the route.
 */

export const AccessControl = ({ roles = [] }: { roles?: object }) => {
  return applyDecorators(
    SetMetadata(ACCESS_METADATA_KEY, {
      roles,
    }),
    UseGuards(RolesGuard),
  );
};
