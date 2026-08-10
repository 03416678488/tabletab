import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@modules/user/entities/users.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { Shift } from './entities/shift.entity';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, User])],
  controllers: [ShiftController],
  // Tenant-aware: shift + user reads/writes resolve to the request's tenant DB,
  // so on-shift lookups line up with the tenant's orders and staff.
  providers: [
    ShiftService,
    tenantRepositoryProvider(Shift),
    tenantRepositoryProvider(User),
  ],
  exports: [ShiftService, TypeOrmModule],
})
export class ShiftModule {}
