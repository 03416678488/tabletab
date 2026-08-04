import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private ready = false;

  onModuleInit() {
    this.client = new Redis(Number(process.env.REDIS_PORT), process.env.REDIS_HOST, {
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 2000),
    });

    this.client.on('ready', () => {
      this.ready = true;
      // console.log('✅ Redis ready');
    });

    this.client.on('error', (err) => {
      this.ready = false;
      console.error('❌ Redis error:', err.message);
    });

    this.client.on('close', () => {
      this.ready = false;
      console.warn('⚠️ Redis connection closed');
    });

    this.client.connect();
  }

  getClient(): Redis {
    return this.client;
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Save a key-value pair to Redis
   * @param key The key to save
   * @param value The value to save (will be JSON stringified if object)
   * @param expirySeconds Optional expiry time in seconds
   * @returns true if saved successfully, false otherwise
   */
  async save(key: string, value: any, expirySeconds?: number): Promise<boolean> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot save key: ${key}`);
      return false;
    }

    try {
      // Convert value to JSON string if it's an object
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);

      if (expirySeconds) {
        // Save with expiry
        await this.client.setex(key, expirySeconds, serialized);
      } else {
        // Save without expiry
        await this.client.set(key, serialized);
      }

      console.log(`[REDIS] Saved key: ${key}`);
      return true;
    } catch (error) {
      console.error(`[REDIS] Error saving key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get a value from Redis
   * @param key The key to retrieve
   * @param parseJson Whether to parse the value as JSON (default: true)
   * @returns The value, or null if key doesn't exist
   */
  async get<T = any>(key: string, parseJson: boolean = true): Promise<T | null> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot get key: ${key}`);
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (!value) {
        console.log(`[REDIS] Key not found: ${key}`);
        return null;
      }

      // Try to parse as JSON if requested
      if (parseJson) {
        try {
          return JSON.parse(value) as T;
        } catch {
          // If parsing fails, return as string
          console.log(`[REDIS] Could not parse JSON for key ${key}, returning as string`);
          return value as unknown as T;
        }
      }

      return value as unknown as T;
    } catch (error) {
      console.error(`[REDIS] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param key The key to check
   * @returns true if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot check key: ${key}`);
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      const result = exists === 1;
      console.log(`[REDIS] Key ${key} exists: ${result}`);
      return result;
    } catch (error) {
      console.error(`[REDIS] Error checking key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   * @param key The key to delete
   * @returns true if deleted, false if key didn't exist or error
   */
  async delete(key: string): Promise<boolean> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot delete key: ${key}`);
      return false;
    }

    try {
      const result = await this.client.del(key);
      console.log(`[REDIS] Deleted key: ${key}`);
      return result === 1;
    } catch (error) {
      console.error(`[REDIS] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get the TTL (time to live) of a key in seconds
   * @param key The key to check
   * @returns TTL in seconds, -1 if key exists but has no TTL, -2 if key doesn't exist
   */
  async getTTL(key: string): Promise<number> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot get TTL for key: ${key}`);
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`[REDIS] Error getting TTL for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Set expiry on an existing key
   * @param key The key to set expiry on
   * @param expirySeconds Expiry time in seconds
   * @returns true if expiry was set, false otherwise
   */
  async setExpiry(key: string, expirySeconds: number): Promise<boolean> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot set expiry for key: ${key}`);
      return false;
    }

    try {
      const result = await this.client.expire(key, expirySeconds);
      console.log(`[REDIS] Set expiry for ${key}: ${expirySeconds}s`);
      return result === 1;
    } catch (error) {
      console.error(`[REDIS] Error setting expiry for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a number value in Redis
   * @param key The key to increment
   * @returns The new value
   */
  async increment(key: string): Promise<number> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot increment key: ${key}`);
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`[REDIS] Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a number value in Redis
   * @param key The key to decrement
   * @returns The new value
   */
  async decrement(key: string): Promise<number> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot decrement key: ${key}`);
      return 0;
    }

    try {
      return await this.client.decr(key);
    } catch (error) {
      console.error(`[REDIS] Error decrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get all keys matching a pattern
   * @param pattern Pattern to match (e.g., "user:*")
   * @returns Array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot get keys with pattern: ${pattern}`);
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`[REDIS] Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Delete multiple keys
   * @param keys Array of keys to delete
   * @returns Number of keys deleted
   */
  async deleteMultiple(keys: string[]): Promise<number> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot delete multiple keys`);
      return 0;
    }

    try {
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (error) {
      console.error(`[REDIS] Error deleting multiple keys:`, error);
      return 0;
    }
  }

  /**
   * Clear all data in Redis database
   * ⚠️ WARNING: This deletes everything!
   */
  async flushAll(): Promise<boolean> {
    if (!this.ready || !this.client) {
      console.warn(`[REDIS] Not ready, cannot flush`);
      return false;
    }

    try {
      await this.client.flushall();
      console.warn(`[REDIS] ⚠️ Flushed all Redis data`);
      return true;
    } catch (error) {
      console.error(`[REDIS] Error flushing Redis:`, error);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      console.log('🛑 Redis connection closed');
    }
  }
}
