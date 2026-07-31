import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from './entities/role.entity';
import { UserRolePermissions } from './entities/user-role-permissions.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { User } from '@modules/user/entities/users.entity';

import { RoleService } from './role.service';
import { RoleValidatorService } from './services/role-validator.service';
import { RoleController } from './role.controller';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { UserModule } from '@modules/user/user.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UserRolePermissions, Permission, User]),

    PaginationModule,
    ErrorModule,

    UserModule,
    PermissionsModule,
  ],
  controllers: [RoleController],
  providers: [RoleService, RoleValidatorService],
  exports: [RoleService, TypeOrmModule],
})
export class RoleModule {}
