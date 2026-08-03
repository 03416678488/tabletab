import { Module } from '@nestjs/common';
import { ErrorProvider } from './error.provider';

@Module({
  providers: [ErrorProvider],
  exports: [ErrorProvider],
})
export class ErrorModule {}
