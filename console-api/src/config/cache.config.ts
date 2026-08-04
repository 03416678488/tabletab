import * as redisStore from 'cache-manager-redis-store';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';

export class CacheConfig implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6382,
      username: 'root',
      password: 'root',
      ttl: 0,
      max: 100,
    };
  }
}
