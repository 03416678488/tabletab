import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return (await this.cacheManager.get(key)) as T | null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    await this.cacheManager.set(key, value, ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    await this.logCacheType();
    return (await this.cacheManager.get(key)) !== null;
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  private async logCacheType() {
    const store = (this.cacheManager as any).store;
    const storeName = store?.name || 'memory';
    this.logger.log(`Using cache store: ${storeName}`);

    try {
      if (storeName === 'ioredis' || store?.getClient) {
        const pong = await store.getClient().ping();
        this.logger.log(`Redis ping: ${pong}`);
      }
    } catch (e) {
      this.logger.error('Redis ping failed', e);
    }
  }
}
