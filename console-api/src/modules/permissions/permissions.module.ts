import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { PermissionsValidatorService } from './services/permission-validator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsValidatorService, PaginationProvider],
  exports: [PermissionsService, PermissionsValidatorService],
})
export class PermissionsModule {}
