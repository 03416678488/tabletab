import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
} from '@nestjs/common';

import { AccessControl } from '@cor/decorators/authorization/authorization.decorator';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { RolePermissionService } from './role-permission.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Controller('role-permissions')
export class RolePermissionController {
  constructor(private readonly _service: RolePermissionService) {}

  /** The current user's effective permissions — powers frontend nav/page gating. */
  @Get('me')
  me(@Req() req: { user?: AuthenticatedUser }) {
    return this._service.buildMyAccess(
      req.user?.roles ?? {},
      !!req.user?.isSuperAdmin,
    );
  }

  /** Roles + module catalog + current grants — everything the UI needs. */
  @Get('matrix')
  getMatrix() {
    return this._service.getMatrix();
  }

  /** Replace one role's grants. Only admins (or a role granted roles:update) may edit. */
  @AccessControl({
    roles: [
      { name: 'Administrators', permissions: { resource: 'roles', actions: 'update' } },
    ],
  })
  @Put(':roleId')
  update(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this._service.updateRoleGrants(roleId, dto.grants);
  }
}
