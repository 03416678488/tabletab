import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { NotificationModule } from '@modules/notification/notification.module';
import { OrderModule } from '@modules/order/order.module';

import { ServiceRequest } from './entities/service-request.entity';
import { ServiceRequestController } from './service-request.controller';
import { ServiceRequestService } from './service-request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest]),
    NotificationModule,
    OrderModule,
  ],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService, tenantRepositoryProvider(ServiceRequest)],
  exports: [ServiceRequestService],
})
export class ServiceRequestModule {}
