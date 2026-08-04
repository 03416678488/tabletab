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
import { boardChannel, orderChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';

import { OrderService } from './order.service';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { CreateOrderDto, UpdateOrderDto, GetOrderQueryDto } from './dto';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly _orderService: OrderService,
    private readonly _realtime: RealtimeService,
  ) {}

  /**
   * Live kitchen/pickup board stream (KDS/OSS). Staff-only — this route is NOT
   * `@Public()`, so the global JWT guard authenticates it and the tenant
   * middleware scopes it. The client sends the bearer token via a fetch-based
   * stream (EventSource can't set headers). Events just say "board changed"; the
   * board refetches `GET /orders/board` to reconcile. Declared before `:id/stream`
   * so `board/stream` isn't captured as an order id.
   */
  @Sse('board/stream')
  streamBoard(@CurrentTenant() tenant: TenantRecord | null): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, boardChannel(tenant?.id));
  }

  /**
   * Live order-status stream for the storefront tracking page. Public: the order
   * UUID is an unguessable capability (same trust model as `GET /orders/:id`).
   * The client fetches current state over REST, then applies these deltas.
   */
  @Public()
  @Sse(':id/stream')
  streamOrder(@Param('id', ParseUUIDPipe) id: string): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, orderChannel(id));
  }

  @Get()
  getAll(@Query() query: GetOrderQueryDto) {
    return this._orderService.getAll(query);
  }

  @Get('table-stats')
  getTableStats() {
    return this._orderService.getTableStats();
  }

  @Get('board')
  getBoard() {
    return this._orderService.getBoard();
  }

  /** The active/open order for a table (POS load-to-edit), or null. */
  @Get('by-table/:tableId')
  getByTable(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this._orderService.getActiveByTable(tableId);
  }

  // Public so a storefront customer can track their order by id (UUID = unguessable).
  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._orderService.getById(id);
  }

  // Public so the storefront can place online orders (guest or signed-in customer).
  @Public()
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this._orderService.createOrder(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDto) {
    return this._orderService.updateOrder(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._orderService.deleteOrder(id);
  }
}
