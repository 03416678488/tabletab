import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from '@modules/tenant/entities/tenant.entity';
import { TenantDomain } from './entities/tenant-domain.entity';
import { DomainController } from './domain.controller';
import { DomainService } from './domain.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantDomain, Tenant])],
  controllers: [DomainController],
  providers: [DomainService],
  exports: [DomainService],
})
export class DomainModule {}
