import { Injectable } from '@nestjs/common';
import { SharedBullConfigurationFactory } from '@nestjs/bull';
import { QueueOptions } from 'bull';

@Injectable()
export class QueueConfig implements SharedBullConfigurationFactory {
  createSharedConfiguration(): QueueOptions {
    return {
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
      },
      prefix: process.env.APP_NAME || 'default',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: false,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
      settings: {
        guardInterval: 0,
      },
    };
  }
}
