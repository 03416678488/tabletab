import { Global, Module } from '@nestjs/common';

import { RealtimeService } from './realtime.service';

/** Global so any service can inject RealtimeService without importing this module. */
@Global()
@Module({
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
