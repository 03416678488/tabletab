import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GetRoleQueryDto } from './dto/get-role-query.dto';
import { AttachRoleToUserDto } from './dto/attach-role-to-user.dto';
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

@Controller('roles')
export class RoleController {
  constructor(private readonly _roleService: RoleService) {}

  // Listing roles feeds the user-management UI (assigning a role) → `users`.
  @RequirePermission('users')
  @Get()
  getAll(@Query() query: GetRoleQueryDto) {
    return this._roleService.getAll(query);
  }

  // Creating/editing/deleting role *definitions* is an owner-level admin action.
  @RequirePermission('settings')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this._roleService.createRole(dto);
  }

  @RequirePermission('settings')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this._roleService.updateRole(id, dto);
  }

  @RequirePermission('settings')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this._roleService.deleteRole(id);
  }

  // Assigning/removing a user's role is part of user management → `users`.
  @RequirePermission('users')
  @Post('attach')
  attachToUser(@Body() dto: AttachRoleToUserDto) {
    return this._roleService.attachToUser(dto);
  }

  @RequirePermission('users')
  @Post('detach')
  detachFromUser(@Body() dto: AttachRoleToUserDto) {
    return this._roleService.detachFromUser(dto);
  }

  @RequirePermission('users')
  @Get('user/:userId')
  getUserRoles(@Param('userId', ParseIntPipe) userId: string) {
    return this._roleService.getUserRoles(userId);
  }
}
