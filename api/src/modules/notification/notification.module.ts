import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';

import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserRolePermissions]), PaginationModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    // Tenant-aware: notifications and the role lookups that resolve recipients
    // both resolve to the current request's tenant database.
    tenantRepositoryProvider(Notification),
    tenantRepositoryProvider(UserRolePermissions),
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
