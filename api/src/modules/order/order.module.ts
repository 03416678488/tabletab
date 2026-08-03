import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '@modules/table/entities/table.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Customer } from '@modules/customer/entities/customer.entity';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderValidatorService } from './services/order-validator.service';
import { OrderHelperService } from './services/order.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Table, Branch, Customer]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderValidatorService,
    OrderHelperService,
    // Tenant-aware: order reads/writes (and the tables/branches they validate
    // against) resolve to the current request's tenant database. Relations
    // (items, customer) load through the Order connection automatically.
    tenantRepositoryProvider(Order),
    tenantRepositoryProvider(OrderItem),
    tenantRepositoryProvider(Table),
    tenantRepositoryProvider(Branch),
  ],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}
