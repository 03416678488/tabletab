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
import { type Observable } from 'rxjs';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { CurrentTenant } from '@modules/tenancy/current-tenant.decorator';
import { TenantRecord } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { reservationChannel, reservationsChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';

import { ReservationService } from './reservation.service';
import { CreateReservationDto, UpdateReservationDto, GetReservationQueryDto } from './dto';

@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly _reservationService: ReservationService,
    private readonly _realtime: RealtimeService,
  ) {}

  /**
   * Live manager book stream — new + changed reservations for the tenant.
   * Staff-only (guarded); declared before `:id`-shaped routes. The client sends
   * the bearer token via a fetch-based stream.
   */
  @Sse('stream')
  streamReservations(@CurrentTenant() tenant: TenantRecord | null): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, reservationsChannel(tenant?.id));
  }

  // Staff: list/filter the reservation book.
  @Get()
  getAll(@Query() query: GetReservationQueryDto) {
    return this._reservationService.getAll(query);
  }

  /**
   * Live status for the guest's confirmation page. Public: the reservation UUID
   * is an unguessable capability (same trust model as `GET /reservations/:id`).
   */
  @Public()
  @Sse(':id/stream')
  streamReservation(@Param('id', ParseUUIDPipe) id: string): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, reservationChannel(id));
  }

  // Public so a guest can view their booking confirmation.
  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._reservationService.getById(id);
  }

  // Public so the storefront can book a table (guest, no account required).
  @Public()
  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this._reservationService.createReservation(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReservationDto) {
    return this._reservationService.updateReservation(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._reservationService.deleteReservation(id);
  }
}
