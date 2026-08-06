import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MenuItem } from './entities/menu-item.entity';
import { Category } from '@modules/category/entities/category.entity';
import { FoodType } from '@modules/food-type/entities/food-type.entity';
import { Menu } from '@modules/menus/entities/menu.entity';

import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuValidatorService } from './services/menu-validator.service';
import { MenuHelperService } from './services/menu.helper.service';
import { MenuIoService } from './services/menu-io.service';
import { MenuSyncService } from './services/menu-sync.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, Category, FoodType, Menu]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [MenuController],
  providers: [
    MenuService,
    MenuValidatorService,
    MenuHelperService,
    MenuIoService,
    // Singleton (holds debounce timers); operates on the tenant DataSource.
    MenuSyncService,
    // Tenant-aware: every @InjectRepository in this module now resolves to the
    // current request's tenant database (falls back to the default connection).
    tenantRepositoryProvider(MenuItem),
    tenantRepositoryProvider(Category),
    tenantRepositoryProvider(FoodType),
    tenantRepositoryProvider(Menu),
  ],
  exports: [MenuService, MenuIoService, TypeOrmModule],
})
export class MenuModule {}
