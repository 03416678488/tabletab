import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from './entities/tenant.entity';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { ProvisioningService } from './provisioning.service';
import { OwnerSeedingService } from './owner-seeding.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [TenantService, ProvisioningService, OwnerSeedingService],
  exports: [TenantService, OwnerSeedingService],
})
export class TenantModule {}
