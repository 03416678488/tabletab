import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Table } from './entities/table.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Area } from '@modules/area/entities/area.entity';

import { TableController } from './table.controller';
import { TableService } from './table.service';
import { TableValidatorService } from './services/table-validator.service';
import { TableHelperService } from './services/table.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Table, Branch, Area]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [TableController],
  providers: [TableService, TableValidatorService, TableHelperService],
  exports: [TableService, TypeOrmModule],
})
export class TableModule {}
