import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Sse,
  type MessageEvent,
} from '@nestjs/common';
import { type Observable } from 'rxjs';

import { CurrentTenant } from '@modules/tenancy/current-tenant.decorator';
import { TenantRecord } from '@modules/tenancy/tenancy.types';
import { CurrentUser } from '@cor/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { serviceChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';

import { ServiceRequestService } from './service-request.service';

/** Staff-only — the global JWT guard authenticates; requests are tenant-scoped. */
@Controller('service-requests')
export class ServiceRequestController {
  constructor(
    private readonly _service: ServiceRequestService,
    private readonly _realtime: RealtimeService,
  ) {}

  /**
   * Live queue stream. The token rides the query string (EventSource can't set
   * headers). Declared before `:id` so `stream` isn't captured as an id.
   */
  @Sse('stream')
  stream(
    @CurrentTenant() tenant: TenantRecord | null,
  ): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, serviceChannel(tenant?.id));
  }

  @Get()
  listOpen(
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId') branchId?: string,
  ) {
    return this._service.listOpen(user, branchId);
  }

  @Post(':id/resolve')
  resolve(@Param('id', ParseUUIDPipe) id: string) {
    return this._service.resolve(id);
  }
}
