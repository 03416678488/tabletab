import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Area } from './entities/area.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { AreaController } from './area.controller';
import { AreaService } from './area.service';
import { AreaValidatorService } from './services/area-validator.service';
import { AreaHelperService } from './services/area.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [TypeOrmModule.forFeature([Area]), PaginationModule, ErrorModule],
  controllers: [AreaController],
  providers: [
    AreaService,
    AreaValidatorService,
    AreaHelperService,
    tenantRepositoryProvider(Area),
  ],
  exports: [AreaService, TypeOrmModule],
})
export class AreaModule {}
