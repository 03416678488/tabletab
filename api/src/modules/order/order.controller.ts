import {
  Body,
  Controller,
  ForbiddenException,
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
import { CurrentUser } from '@cor/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';
import { TenantRecord } from '@modules/tenancy/tenancy.types';
import { boardChannel, orderChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';

import { OrderService } from './order.service';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { CreateOrderDto, UpdateOrderDto, GetOrderQueryDto } from './dto';
import {
  assertOrderUpdateAllowed,
  canChangePaymentStatus,
} from './order-status.policy';

@RequirePermission('orders')
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
  streamBoard(
    @CurrentTenant() tenant: TenantRecord | null,
  ): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, boardChannel(tenant?.id));
  }

  /**
   * Live order-status stream for the storefront tracking page. Public: the order
   * UUID is an unguessable capability (same trust model as `GET /orders/:id`).
   * The client fetches current state over REST, then applies these deltas.
   */
  @Public()
  @Sse(':id/stream')
  streamOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, orderChannel(id));
  }

  @Get()
  getAll(@Query() query: GetOrderQueryDto) {
    return this._orderService.getAll(query);
  }

  @Get('table-stats')
  getTableStats(
    @Query('branchId', new ParseUUIDPipe({ optional: true })) branchId?: string,
  ) {
    return this._orderService.getTableStats(branchId);
  }

  /** All running orders in a branch (POS "load open order" picker). */
  @Get('active')
  active(
    @Query('branchId', new ParseUUIDPipe({ optional: true })) branchId?: string,
  ) {
    return this._orderService.listActive(branchId);
  }

  @Get('board')
  getBoard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId', new ParseUUIDPipe({ optional: true })) branchId?: string,
  ) {
    return this._orderService.getBoard(branchId, user);
  }

  /** The active/open order for a table (POS load-to-edit), or null. */
  @Get('by-table/:tableId')
  getByTable(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this._orderService.getActiveByTable(tableId);
  }

  // Public so a signed-in storefront customer can load their own order history.
  // Declared before `:id` so the static `customer` segment isn't captured as an id.
  @Public()
  @Get('customer/:customerId')
  getByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this._orderService.getAll({
      customerId,
      page: 1,
      perPage: 50,
    } as GetOrderQueryDto);
  }

  // Public so a storefront customer can track their order by id (UUID = unguessable).
  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._orderService.getById(id);
  }

  // Public so the storefront can place online orders (guest or signed-in
  // customer). The global JWT guard still decodes a token when present, so
  // `user` is set for authenticated staff (POS) and undefined for guests — the
  // service uses that to decide whether to trust or re-price the order.
  @Public()
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this._orderService.createOrder(dto, user);
  }

  /**
   * Confirm payment on a prepay ('pending_payment') dine-in order — a staff
   * manual confirmation (e.g. the guest paid cash) that flips it live to the
   * kitchen. Requires the same permission as marking an order paid. The Phase 2
   * payment-gateway webhook will call `confirmDineInPayment` directly (server to
   * server), not this staff route.
   */
  @Post(':id/confirm-payment')
  confirmPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user?.isSuperAdmin && !canChangePaymentStatus(user?.roleNames ?? [])) {
      throw new ForbiddenException('You are not allowed to confirm payment.');
    }
    return this._orderService.confirmDineInPayment(id);
  }

  /**
   * Close a table's session — settle every active order (all rounds) on the
   * table and free it. `markPaid` (default true) settles as paid; false records
   * a walkout/comp (completed, unpaid). Same permission as marking an order paid.
   */
  @Post('table/:tableId/close')
  closeTable(
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Body('markPaid') markPaid: boolean | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user?.isSuperAdmin && !canChangePaymentStatus(user?.roleNames ?? [])) {
      throw new ForbiddenException('You are not allowed to close a table.');
    }
    return this._orderService.closeTableSession(tableId, markPaid ?? true);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Role scope: who may change status / mark paid (Chef = kitchen statuses
    // only, never payment). Super admins bypass. Internal writes (webhooks,
    // status sync) call the service directly and are not gated here.
    if (!user?.isSuperAdmin) {
      assertOrderUpdateAllowed(user?.roleNames ?? [], dto);
    }
    return this._orderService.updateOrder(id, dto);
  }
}
