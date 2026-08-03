import { applyDecorators, UseGuards } from '@nestjs/common';

import { PlatformAdminGuard } from './platform-admin.guard';

/**
 * Restrict a route or controller to platform administrators.
 * Apply on top of the global auth guard — e.g. `@PlatformAdmin()` on a controller.
 */
export const PlatformAdmin = () => applyDecorators(UseGuards(PlatformAdminGuard));
