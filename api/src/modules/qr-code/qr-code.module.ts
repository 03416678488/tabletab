import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QrCode } from './entities/qr-code.entity';
import { Table } from '@modules/table/entities/table.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { QrCodeController } from './qr-code.controller';
import { QrCodeService } from './qr-code.service';
import { QrCodeValidatorService } from './services/qr-code-validator.service';
import { QrCodeHelperService } from './services/qr-code.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QrCode, Table]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [QrCodeController],
  providers: [
    QrCodeService,
    QrCodeValidatorService,
    QrCodeHelperService,
    tenantRepositoryProvider(QrCode),
    tenantRepositoryProvider(Table),
  ],
  exports: [QrCodeService, TypeOrmModule],
})
export class QrCodeModule {}
