import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ExtendedAppConfig } from './extend-app-config.config';
import TypeOrmConfig from './typeorm.config';
import { QueueConfig } from './queue.config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { validationSchema } from '@config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    BullModule.forRootAsync({
      useClass: QueueConfig,
    }),
    ExtendedAppConfig,
    TypeOrmModule.forRoot({
      ...TypeOrmConfig,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
          },
          username: process.env.REDIS_USERNAME,
          password: process.env.REDIS_PASSWORD,
        }),
      }),
    }),
  ],
})
export class ConfigModules {}
