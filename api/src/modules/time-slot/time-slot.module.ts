import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeSlot } from './entities/time-slot.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { TimeSlotController } from './time-slot.controller';
import { TimeSlotService } from './time-slot.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlot])],
  controllers: [TimeSlotController],
  providers: [TimeSlotService, tenantRepositoryProvider(TimeSlot)],
  exports: [TimeSlotService, TypeOrmModule],
})
export class TimeSlotModule {}
