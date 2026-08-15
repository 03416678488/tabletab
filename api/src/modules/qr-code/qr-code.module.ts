import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QrCode } from './entities/qr-code.entity';
import { TableSession } from './entities/table-session.entity';
import { Table } from '@modules/table/entities/table.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { QrCodeController } from './qr-code.controller';
import { QrCodeService } from './qr-code.service';
import { TableSessionService } from './table-session.service';
import { QrCodeValidatorService } from './services/qr-code-validator.service';
import { QrCodeHelperService } from './services/qr-code.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { OrderModule } from '@modules/order/order.module';
import { ServiceRequestModule } from '@modules/service-request/service-request.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QrCode, TableSession, Table]),
    PaginationModule,
    ErrorModule,
    OrderModule,
    ServiceRequestModule,
  ],
  controllers: [QrCodeController],
  providers: [
    QrCodeService,
    TableSessionService,
    QrCodeValidatorService,
    QrCodeHelperService,
    tenantRepositoryProvider(QrCode),
    tenantRepositoryProvider(TableSession),
    tenantRepositoryProvider(Table),
  ],
  exports: [QrCodeService, TypeOrmModule],
})
export class QrCodeModule {}
