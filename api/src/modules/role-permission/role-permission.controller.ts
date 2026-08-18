import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
} from '@nestjs/common';

import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';
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

  /** Roles + module catalog + current grants — the permissions manager (Settings). */
  @RequirePermission('settings')
  @Get('matrix')
  getMatrix() {
    return this._service.getMatrix();
  }

  /** Replace one role's grants — an owner-level Settings action. */
  @RequirePermission('settings')
  @Put(':roleId')
  update(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this._service.updateRoleGrants(roleId, dto.grants);
  }
}
