import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { OrderModule } from '@modules/order/order.module';
import { MenuModule } from '@modules/menu/menu.module';

import { Integration } from './entities/integration.entity';
import { IntegrationSyncLog } from './entities/integration-sync-log.entity';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { AggregatorService } from './services/integration-aggregator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Integration, IntegrationSyncLog]), OrderModule, MenuModule],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    AggregatorService,
    tenantRepositoryProvider(Integration),
    tenantRepositoryProvider(IntegrationSyncLog),
  ],
  exports: [IntegrationService],
})
export class IntegrationModule {}
