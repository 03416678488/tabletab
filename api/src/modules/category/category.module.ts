import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from './entities/category.entity';
import { CategoryTranslation } from './entities/category-translation.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryValidatorService } from './services/category-validator.service';
import { CategoryHelperService } from './services/category.helper.service';
import { CategoryTranslationService } from './services/category-translation.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { SettingModule } from '@modules/setting/setting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, CategoryTranslation]),
    PaginationModule,
    ErrorModule,
    SettingModule,
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryValidatorService,
    CategoryHelperService,
    CategoryTranslationService,
    tenantRepositoryProvider(Category),
    tenantRepositoryProvider(CategoryTranslation),
  ],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
