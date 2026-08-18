import {
  Body,
  Controller,
  Delete,
  Get,
  type MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Sse,
} from '@nestjs/common';
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';
import { type Observable } from 'rxjs';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { CurrentTenant } from '@modules/tenancy/current-tenant.decorator';
import { TenantRecord } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { eventChannel, eventsChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';

import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto, GetEventQueryDto } from './dto';

@RequirePermission('events')
@Controller('events')
export class EventController {
  constructor(
    private readonly _eventService: EventService,
    private readonly _realtime: RealtimeService,
  ) {}

  /** Live manager book stream — new + changed event bookings for the tenant. Staff. */
  @Sse('stream')
  streamEvents(
    @CurrentTenant() tenant: TenantRecord | null,
  ): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, eventsChannel(tenant?.id));
  }

  // Staff: list/filter the event book.
  @Get()
  getAll(@Query() query: GetEventQueryDto) {
    return this._eventService.getAll(query);
  }

  /** Live status for the guest's confirmation page. Public (UUID capability). */
  @Public()
  @Sse(':id/stream')
  streamEvent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, eventChannel(id));
  }

  // Public so a guest can view their booking confirmation.
  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._eventService.getById(id);
  }

  // Public so the storefront can submit an event inquiry (guest, no account).
  @Public()
  @Post()
  create(@Body() dto: CreateEventDto) {
    return this._eventService.createEvent(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this._eventService.updateEvent(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._eventService.deleteEvent(id);
  }
}
