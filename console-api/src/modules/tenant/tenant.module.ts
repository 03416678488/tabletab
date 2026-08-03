import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from './entities/tenant.entity';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { ProvisioningService } from './provisioning.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [TenantService, ProvisioningService],
  exports: [TenantService],
})
export class TenantModule {}
