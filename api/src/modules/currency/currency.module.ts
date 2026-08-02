import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SettingModule } from '@modules/setting/setting.module';

import { Currency } from './entities/currency.entity';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { CurrencyRatesService } from './currency-rates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Currency]), SettingModule],
  controllers: [CurrencyController],
  providers: [CurrencyService, CurrencyRatesService],
  exports: [CurrencyService, TypeOrmModule],
})
export class CurrencyModule {}
