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
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Users, optionally filtered by role name (e.g. Waiters). */
  @RequirePermission('users')
  @Get('list')
  list(@Query('role') role?: string, @Query('search') search?: string) {
    return this.userService.listUsers({ role, search });
  }

  /** Assign a user's home branch (for branch-scoped notifications). */
  @RequirePermission('users')
  @Patch(':id/branch')
  setBranch(@Param('id') id: string, @Body() dto: SetUserBranchDto) {
    return this.userService.setBranch(id, dto.branchId ?? null);
  }

  @RequirePermission('users')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(
      createUserDto,
      createUserDto.roleName ?? 'Customer',
    );
  }

  /** The caller's own profile — any authenticated user, no module grant needed. */
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findOne(req.user.id);
  }

  @RequirePermission('users')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @RequirePermission('users')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.softDeleteUser(id);
  }
}
