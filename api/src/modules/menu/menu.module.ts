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

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, Category, FoodType, Menu]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [MenuController],
  providers: [MenuService, MenuValidatorService, MenuHelperService],
  exports: [MenuService, TypeOrmModule],
})
export class MenuModule {}
