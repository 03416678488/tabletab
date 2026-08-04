import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseSuccessInterceptor } from './response.success.interceptor';
import { ResponseExceptionFilter } from './response.error.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSuccessInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ResponseExceptionFilter,
    },
  ],
})
export class ResponseModule {}
