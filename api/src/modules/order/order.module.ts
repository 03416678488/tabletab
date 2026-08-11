import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '@modules/table/entities/table.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Customer } from '@modules/customer/entities/customer.entity';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { Integration } from '@modules/integration/entities/integration.entity';
import { IntegrationSyncLog } from '@modules/integration/entities/integration-sync-log.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderValidatorService } from './services/order-validator.service';
import { OrderHelperService } from './services/order.helper.service';
import { OrderStatusSyncService } from './services/order-status-sync.service';
import { StaffAssignmentService } from './services/staff-assignment.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { PromotionModule } from '@modules/promotion/promotion.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { ShiftModule } from '@modules/shift/shift.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Table,
      Branch,
      Customer,
      MenuItem,
      Integration,
      IntegrationSyncLog,
      UserRolePermissions,
    ]),
    PaginationModule,
    ErrorModule,
    PromotionModule,
    NotificationModule,
    ShiftModule,
    InventoryModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderValidatorService,
    OrderHelperService,
    OrderStatusSyncService,
    StaffAssignmentService,
    tenantRepositoryProvider(Integration),
    tenantRepositoryProvider(IntegrationSyncLog),
    tenantRepositoryProvider(UserRolePermissions),
    // Tenant-aware: order reads/writes (and the tables/branches they validate
    // against) resolve to the current request's tenant database. Relations
    // (items, customer) load through the Order connection automatically.
    tenantRepositoryProvider(Order),
    tenantRepositoryProvider(OrderItem),
    tenantRepositoryProvider(Table),
    tenantRepositoryProvider(Branch),
    // Read-only here: authoritative re-pricing of guest orders against the
    // real menu (clients can never dictate the price).
    tenantRepositoryProvider(MenuItem),
  ],
  exports: [OrderService, StaffAssignmentService, TypeOrmModule],
})
export class OrderModule {}
