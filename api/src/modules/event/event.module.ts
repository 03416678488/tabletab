import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from './entities/event.entity';
import { EventType } from './entities/event-type.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventValidatorService } from './services/event-validator.service';
import { EventHelperService } from './services/event.helper.service';
import { EventMailService } from './services/event-mail.service';

import { EventTypeController } from './event-type.controller';
import { EventTypeService } from './event-type.service';
import { EventTypeValidatorService } from './services/event-type-validator.service';
import { EventTypeHelperService } from './services/event-type.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { NotificationModule } from '@modules/notification/notification.module';
import { TransactionModule } from '@modules/transaction/transaction.module';
import { MailModule } from '@modules/mail/mail.module';
import { SettingModule } from '@modules/setting/setting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventType, Branch]),
    PaginationModule,
    ErrorModule,
    NotificationModule,
    TransactionModule,
    MailModule,
    SettingModule,
  ],
  controllers: [EventController, EventTypeController],
  providers: [
    EventService,
    EventValidatorService,
    EventHelperService,
    EventMailService,
    EventTypeService,
    EventTypeValidatorService,
    EventTypeHelperService,
    // Tenant-aware: events + types (and the branches they reference) resolve to
    // the current request's tenant database.
    tenantRepositoryProvider(Event),
    tenantRepositoryProvider(EventType),
    tenantRepositoryProvider(Branch),
  ],
  exports: [EventService, EventTypeService, TypeOrmModule],
})
export class EventModule {}
