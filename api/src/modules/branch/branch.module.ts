import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Branch } from './entities/branch.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { BranchValidatorService } from './services/branch-validator.service';
import { BranchHelperService } from './services/branch.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [BranchController],
  providers: [
    BranchService,
    BranchValidatorService,
    BranchHelperService,
    tenantRepositoryProvider(Branch),
  ],
  exports: [BranchService, TypeOrmModule],
})
export class BranchModule {}
