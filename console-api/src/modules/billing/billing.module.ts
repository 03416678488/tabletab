import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from '@modules/tenant/entities/tenant.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
