import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FoodType } from './entities/food-type.entity';

import { FoodTypeController } from './food-type.controller';
import { FoodTypeService } from './food-type.service';
import { FoodTypeValidatorService } from './services/food-type-validator.service';
import { FoodTypeHelperService } from './services/food-type.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [TypeOrmModule.forFeature([FoodType]), PaginationModule, ErrorModule],
  controllers: [FoodTypeController],
  providers: [FoodTypeService, FoodTypeValidatorService, FoodTypeHelperService],
  exports: [FoodTypeService, TypeOrmModule],
})
export class FoodTypeModule {}
