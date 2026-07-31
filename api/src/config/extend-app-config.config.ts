import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          appName: process.env.APP_NAME || 'elite-marketing-cloud',
          appDescription: process.env.APP_DESCRIPTION || 'Elite Marketing Cloud API',
          appVersion: process.env.APP_VERSION || '1.0.0',
          appPort: Number(process.env.APP_PORT) || 3000,
        }),
        () => ({
          postgresHost: process.env.POSTGRES_HOST || 'localhost',
          postgresPort: Number(process.env.POSTGRES_PORT) || 5432,
          postgresUser: process.env.POSTGRES_USER || 'postgres',
          postgresPassword: process.env.POSTGRES_PASSWORD || 'password',
          postgresDatabase: process.env.POSTGRES_DATABASE || 'nest-crud',
          runMigrations: process.env.RUN_MIGRATIONS === 'true',
        }),
        () => ({
          redisHost: process.env.REDIS_HOST || 'localhost',
          redisPort: Number(process.env.REDIS_PORT) || 6379,
          redisUsername: process.env.REDIS_USERNAME || 'default',
          redisPassword: process.env.REDIS_PASSWORD || 'password',
          redisTtl: Number(process.env.REDIS_TTL) || 3600,
          redisMax: Number(process.env.REDIS_MAX) || 100,
        }),
      ],
    }),
  ],
})
export class ExtendedAppConfig {}
