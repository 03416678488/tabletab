import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { OrderItem } from '@modules/order/entities/order-item.entity';

import { StockItem } from './entities/stock-item.entity';
import { StockLevel } from './entities/stock-level.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { RecipeLine } from './entities/recipe-line.entity';
import { StockTake } from './entities/stock-take.entity';
import { StockTakeLine } from './entities/stock-take-line.entity';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { RecipeService } from './recipe.service';
import { InventoryDeductionService } from './inventory-deduction.service';
import { InventoryAlertService } from './services/inventory-alert.service';
import { StockTakeService } from './stock-take.service';
import { InventoryReportService } from './inventory-report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockItem,
      StockLevel,
      StockMovement,
      RecipeLine,
      StockTake,
      StockTakeLine,
      MenuItem,
      OrderItem,
    ]),
    PaginationModule,
    NotificationModule,
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    RecipeService,
    InventoryDeductionService,
    InventoryAlertService,
    StockTakeService,
    InventoryReportService,
    // Tenant-aware: every inventory table (and the menu/order rows it reads)
    // resolves to the current request's tenant database.
    tenantRepositoryProvider(StockItem),
    tenantRepositoryProvider(StockLevel),
    tenantRepositoryProvider(StockMovement),
    tenantRepositoryProvider(RecipeLine),
    tenantRepositoryProvider(StockTake),
    tenantRepositoryProvider(StockTakeLine),
    tenantRepositoryProvider(MenuItem),
    tenantRepositoryProvider(OrderItem),
  ],
  // Exported so the order flow can trigger confirm-time deduction / restock.
  exports: [InventoryDeductionService, InventoryService, TypeOrmModule],
})
export class InventoryModule {}
