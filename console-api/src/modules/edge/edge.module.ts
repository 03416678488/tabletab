import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from '@modules/tenant/entities/tenant.entity';
import { TenantDomain } from '@modules/domain/entities/tenant-domain.entity';
import { EdgeController } from './edge.controller';
import { EdgeService } from './edge.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantDomain, Tenant])],
  controllers: [EdgeController],
  providers: [EdgeService],
})
export class EdgeModule {}
