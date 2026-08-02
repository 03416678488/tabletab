import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolePermission } from './entities/role-permission.entity';
import { Role } from '@modules/role/entities/role.entity';

import { RolePermissionController } from './role-permission.controller';
import { RolePermissionService } from './role-permission.service';

import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission, Role]), ErrorModule],
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
  exports: [RolePermissionService, TypeOrmModule],
})
export class RolePermissionModule {}
