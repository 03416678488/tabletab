import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from './entities/category.entity';

import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryValidatorService } from './services/category-validator.service';
import { CategoryHelperService } from './services/category.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), PaginationModule, ErrorModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryValidatorService, CategoryHelperService],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
