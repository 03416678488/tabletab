import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Staff } from './entities/staff.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffValidatorService } from './services/staff-validator.service';
import { StaffHelperService } from './services/staff.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff, Branch]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffValidatorService, StaffHelperService],
  exports: [StaffService, TypeOrmModule],
})
export class StaffModule {}
