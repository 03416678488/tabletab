import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KioskMachine } from './entities/kiosk-machine.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { KioskMachineController } from './kiosk-machine.controller';
import { KioskMachineService } from './kiosk-machine.service';

@Module({
  imports: [TypeOrmModule.forFeature([KioskMachine])],
  controllers: [KioskMachineController],
  providers: [KioskMachineService, tenantRepositoryProvider(KioskMachine)],
  exports: [KioskMachineService, TypeOrmModule],
})
export class KioskMachineModule {}
