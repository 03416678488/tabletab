import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from '@modules/role/entities/role.entity';
import { User } from 'src/modules/user/entities/users.entity';
import { CodeAttemptLog } from './entities/code-attempt-log.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRolePermissions, Role, Permission, CodeAttemptLog]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
