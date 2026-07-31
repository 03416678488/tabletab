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

@Controller('roles')
export class RoleController {
  constructor(private readonly _roleService: RoleService) {}

  @Get()
  getAll(@Query() query: GetRoleQueryDto) {
    return this._roleService.getAll(query);
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this._roleService.createRole(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this._roleService.updateRole(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this._roleService.deleteRole(id);
  }

  @Post('attach')
  attachToUser(@Body() dto: AttachRoleToUserDto) {
    return this._roleService.attachToUser(dto);
  }

  @Post('detach')
  detachFromUser(@Body() dto: AttachRoleToUserDto) {
    return this._roleService.detachFromUser(dto);
  }

  @Get('user/:userId')
  getUserRoles(@Param('userId', ParseIntPipe) userId: string) {
    return this._roleService.getUserRoles(userId);
  }
}
