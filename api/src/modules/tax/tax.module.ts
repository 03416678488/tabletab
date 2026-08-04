import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tax } from './entities/tax.entity';
import { TaxGroup } from './entities/tax-group.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';
import { TaxGroupController } from './tax-group.controller';
import { TaxGroupService } from './tax-group.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tax, TaxGroup])],
  controllers: [TaxController, TaxGroupController],
  providers: [
    TaxService,
    TaxGroupService,
    tenantRepositoryProvider(Tax),
    tenantRepositoryProvider(TaxGroup),
  ],
  exports: [TaxService, TaxGroupService, TypeOrmModule],
})
export class TaxModule {}
