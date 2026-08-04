import { Global, Module } from '@nestjs/common';
import { TransactionService } from 'src/services/transaction.service';
import { CacheService } from '@services/cache.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [TransactionService, CacheService, RedisService],
  exports: [TransactionService, CacheService, RedisService],
})
export class GlobalServicesModule {}
