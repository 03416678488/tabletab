import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';

import { SupplierController } from './supplier.controller';
import { PurchaseOrderController } from './purchase-order.controller';
import { SupplierService } from './supplier.service';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, PurchaseOrder, PurchaseOrderLine]),
    PaginationModule,
    // Receiving a PO increments stock through the inventory service.
    InventoryModule,
  ],
  controllers: [SupplierController, PurchaseOrderController],
  providers: [
    SupplierService,
    PurchaseOrderService,
    // Tenant-aware: suppliers + purchase orders resolve to the request's tenant DB.
    tenantRepositoryProvider(Supplier),
    tenantRepositoryProvider(PurchaseOrder),
    tenantRepositoryProvider(PurchaseOrderLine),
  ],
  exports: [SupplierService, PurchaseOrderService, TypeOrmModule],
})
export class PurchasingModule {}
