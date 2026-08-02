import { Global, Module } from '@nestjs/common';
import { TransactionService } from 'src/services/transaction.service';
import { CacheService } from '@services/cache.service';
import { RedisService } from './redis.service';
import { ExchangeRateService } from './exchange-rate';

@Global()
@Module({
  providers: [TransactionService, CacheService, RedisService, ExchangeRateService],
  exports: [TransactionService, CacheService, RedisService, ExchangeRateService],
})
export class GlobalServicesModule {}
