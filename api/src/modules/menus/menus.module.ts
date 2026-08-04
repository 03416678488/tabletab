import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Menu } from './entities/menu.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { MenusValidatorService } from './services/menus-validator.service';
import { MenusHelperService } from './services/menus.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [TypeOrmModule.forFeature([Menu]), PaginationModule, ErrorModule],
  controllers: [MenusController],
  providers: [
    MenusService,
    MenusValidatorService,
    MenusHelperService,
    tenantRepositoryProvider(Menu),
  ],
  exports: [MenusService, TypeOrmModule],
})
export class MenusModule {}
