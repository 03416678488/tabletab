import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reservation } from './entities/reservation.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Table } from '@modules/table/entities/table.entity';

import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { ReservationValidatorService } from './services/reservation-validator.service';
import { ReservationHelperService } from './services/reservation.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { NotificationModule } from '@modules/notification/notification.module';
import { TransactionModule } from '@modules/transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Branch, Table]),
    PaginationModule,
    ErrorModule,
    NotificationModule,
    TransactionModule,
  ],
  controllers: [ReservationController],
  providers: [
    ReservationService,
    ReservationValidatorService,
    ReservationHelperService,
    // Tenant-aware: reservations (and the branches/tables they validate against)
    // resolve to the current request's tenant database.
    tenantRepositoryProvider(Reservation),
    tenantRepositoryProvider(Branch),
    tenantRepositoryProvider(Table),
  ],
  exports: [ReservationService, TypeOrmModule],
})
export class ReservationModule {}
