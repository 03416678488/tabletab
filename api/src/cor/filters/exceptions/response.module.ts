import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseExceptionFilter } from './response.filter';
import { ResponseInterceptor } from './response.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ResponseExceptionFilter,
    },
  ],
})
export class ResponseModule {}
