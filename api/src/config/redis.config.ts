import * as redisStore from 'cache-manager-ioredis';

export const redisConfig = {
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  ttl: Number(process.env.REDIS_TTL),
  max: Number(process.env.REDIS_MAX),
  isGlobal: true,
};
