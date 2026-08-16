import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetUserBranchDto } from './dto/set-user-branch.dto';
import { AccessControl } from '@cor/decorators/authorization/authorization.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Users, optionally filtered by role name (e.g. Waiters). */
  @Get('list')
  list(@Query('role') role?: string, @Query('search') search?: string) {
    return this.userService.listUsers({ role, search });
  }

  /** Assign a user's home branch (for branch-scoped notifications). */
  @Patch(':id/branch')
  setBranch(@Param('id') id: string, @Body() dto: SetUserBranchDto) {
    return this.userService.setBranch(id, dto.branchId ?? null);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(
      createUserDto,
      createUserDto.roleName ?? 'Customer',
    );
  }

  @AccessControl({
    roles: [
      { name: 'admin', permissions: { resource: 'profile', actions: 'read' } },
      {
        name: 'vendor',
        permissions: { resource: 'profile', actions: 'read' },
      },
    ],
  })
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findOne(req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.softDeleteUser(id);
  }
}
