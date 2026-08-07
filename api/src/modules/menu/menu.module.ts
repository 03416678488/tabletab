import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MenuItem } from './entities/menu-item.entity';
import { MenuItemTranslation } from './entities/menu-item-translation.entity';
import { Category } from '@modules/category/entities/category.entity';
import { FoodType } from '@modules/food-type/entities/food-type.entity';
import { Menu } from '@modules/menus/entities/menu.entity';

import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuValidatorService } from './services/menu-validator.service';
import { MenuHelperService } from './services/menu.helper.service';
import { MenuIoService } from './services/menu-io.service';
import { MenuSyncService } from './services/menu-sync.service';
import { MenuTranslationService } from './services/menu-translation.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { SettingModule } from '@modules/setting/setting.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, MenuItemTranslation, Category, FoodType, Menu]),
    PaginationModule,
    ErrorModule,
    SettingModule,
  ],
  controllers: [MenuController],
  providers: [
    MenuService,
    MenuValidatorService,
    MenuHelperService,
    MenuIoService,
    MenuTranslationService,
    // Singleton (holds debounce timers); operates on the tenant DataSource.
    MenuSyncService,
    // Tenant-aware: every @InjectRepository in this module now resolves to the
    // current request's tenant database (falls back to the default connection).
    tenantRepositoryProvider(MenuItem),
    tenantRepositoryProvider(MenuItemTranslation),
    tenantRepositoryProvider(Category),
    tenantRepositoryProvider(FoodType),
    tenantRepositoryProvider(Menu),
  ],
  exports: [MenuService, MenuIoService, TypeOrmModule],
})
export class MenuModule {}
