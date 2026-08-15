import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';

import { TransactionService } from '@services/transaction.service';

import { TenantRequest } from '@modules/tenancy/tenancy.types';
import {
  boardChannel,
  orderChannel,
  tablesChannel,
} from '@modules/realtime/channels';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { TableSession } from '@modules/qr-code/entities/table-session.entity';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';
import { OrderValidatorService } from './services/order-validator.service';
import { OrderHelperService } from './services/order.helper.service';
import { CreateOrderDto, UpdateOrderDto, GetOrderQueryDto } from './dto';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { NotificationService } from '@modules/notification/notification.service';
import { OrderStatusSyncService } from './services/order-status-sync.service';
import { StaffAssignmentService } from './services/staff-assignment.service';
import { PromotionService } from '@modules/promotion/promotion.service';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Statuses that keep a table "busy". Completed / cancelled free it up. */
const ACTIVE_STATUSES: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'served',
];

/** Statuses the kitchen (KDS) and pickup (OSS) boards care about. */
const BOARD_STATUSES: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
];

export interface TableSessionRound {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: 'paid' | 'unpaid';
  createdAt: string;
  total: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    notes: string | null;
  }[];
}

/** A table's running bill = every active order (round) on the table, merged. */
export interface TableSessionBill {
  tableId: string;
  tableName: string | null;
  branchId: string | null;
  orderCount: number;
  rounds: TableSessionRound[];
  /** Line items merged across rounds (same name + unit price folded together). */
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
}

export interface TableStat {
  tableId: string;
  status: 'kot' | 'occupied';
  /** Lifecycle status of the latest active order on the table. */
  orderStatus: OrderStatus;
  orderCount: number;
  itemCount: number;
  total: number;
  lastOrderAt: string;
}

/** Main order flow only — validation + normalization live in the sibling services. */
@Injectable()
export class OrderService extends AbstractService<Order> {
  constructor(
    @InjectRepository(Order)
    protected readonly repository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly _itemRepo: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private readonly _menuItems: Repository<MenuItem>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: OrderValidatorService,
    private readonly _helper: OrderHelperService,
    private readonly _realtime: RealtimeService,
    private readonly _promotions: PromotionService,
    private readonly _notifications: NotificationService,
    private readonly _statusSync: OrderStatusSyncService,
    private readonly _assignment: StaffAssignmentService,
    private readonly _transactionService: TransactionService,
    @InjectRepository(TableSession)
    private readonly _tableSessions: Repository<TableSession>,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /** Push a minimal status event to the order's tracking channel (post-commit). */
  private emitOrder(
    order: Order,
    type: 'order.created' | 'order.updated',
  ): void {
    this._realtime.publish(orderChannel(order.id), type, {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      updatedAt: order.updatedAt,
    });
  }

  /**
   * Nudge the tenant's kitchen/pickup board to reconcile. Scoped by the request's
   * tenant so one restaurant's boards never wake up for another's orders.
   */
  private emitBoard(order: Order): void {
    this._realtime.publish(
      boardChannel(this._req.tenant?.id),
      'board.changed',
      {
        orderId: order.id,
        status: order.status,
      },
    );
    // A table order shifts floor occupancy — nudge the floor views too.
    if (order.tableId) {
      this._realtime.publish(
        tablesChannel(this._req.tenant?.id),
        'tables.changed',
        {
          tableId: order.tableId,
        },
      );
    }
  }

  /**
   * Route an order event to ONE assigned staff member (best-effort — a
   * notification failure must never break the order flow):
   *  - `placed`  → the branch's on-shift chef prepares it.
   *  - `ready`   → an on-shift waiter (dine-in/pickup) or rider (delivery) takes it.
   * The chosen person is recorded on the order and notified alone. When nobody of
   * that role is on shift we fall back to a role + manager broadcast so the work
   * is never dropped.
   */
  private async notify(order: Order, kind: 'placed' | 'ready'): Promise<void> {
    const where = order.table?.name ?? order.customerName ?? order.orderType;
    const summary = `${order.items?.length ?? 0} item${order.items?.length === 1 ? '' : 's'} · ${where}`;
    const branchId = order.branchId ?? null;
    const data = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,
    };
    try {
      if (kind === 'placed') {
        await this.routeToAssignee({
          role: 'Chef',
          column: 'assignedChefId',
          orderId: order.id,
          branchId,
          payload: {
            category: 'orders',
            type: 'order.placed',
            title: `New order ${order.orderNumber}`,
            body: summary,
            data,
            priority: 'normal',
            branchId,
          },
        });
      } else {
        // A delivery order (non-dine-in with an address) goes to a rider; every
        // other ready order goes to a waiter.
        const isDelivery =
          order.orderType !== 'table' && !!order.customerAddress;
        await this.routeToAssignee({
          role: isDelivery ? 'Delivery Rider' : 'Waiter',
          column: isDelivery ? 'assignedRiderId' : 'assignedWaiterId',
          orderId: order.id,
          branchId,
          payload: {
            category: 'orders',
            type: 'order.ready',
            title: `Order ${order.orderNumber} is ready`,
            body: summary,
            data,
            priority: 'high',
            branchId,
          },
        });
      }
    } catch (err) {
      console.warn(
        '[notify] order notification failed',
        (err as Error).message,
      );
    }
  }

  /** Assign the work to one on-shift person and notify only them; if nobody of
   *  that role is on shift, broadcast to the role + managers instead. */
  private async routeToAssignee(opts: {
    role: 'Chef' | 'Waiter' | 'Delivery Rider';
    column: 'assignedChefId' | 'assignedWaiterId' | 'assignedRiderId';
    orderId: string;
    branchId: string | null;
    payload: Parameters<NotificationService['notifyUsers']>[1];
  }): Promise<void> {
    const assignee = await this._assignment.pickAssignee(
      opts.role,
      opts.branchId,
    );
    if (assignee) {
      await this.repository.update(opts.orderId, { [opts.column]: assignee });
      await this._notifications.notifyUsers([assignee], opts.payload);
    } else {
      await this._notifications.notifyRoles(
        [opts.role, 'Branch Manager', 'Multi Branch Manager', 'Owner'],
        opts.payload,
      );
    }
  }

  getAll(query: GetOrderQueryDto): Promise<Paginated<Order>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(
      query,
      this.repository,
      where,
      ['table', 'table.area', 'branch', 'customer', 'items'],
      undefined,
      { createdAt: 'DESC' },
    );
  }

  getById(id: string): Promise<Order> {
    return this._validator.ensureExists(id);
  }

  /** Live kitchen/pickup board — active orders oldest-first, with everything needed to render a ticket. */
  getBoard(branchId?: string, user?: AuthenticatedUser): Promise<Order[]> {
    const base: FindOptionsWhere<Order> = {
      status: In(BOARD_STATUSES),
      ...(branchId ? { branchId } : {}),
    };
    // Non-managers only see their own assigned work plus anything still
    // unassigned (the fallback pool); managers/owner see the whole board.
    const scope = this.assigneeScope(user);
    const where = scope
      ? [
          { ...base, [scope.column]: scope.userId },
          { ...base, [scope.column]: IsNull() },
        ]
      : base;
    return this.repository.find({
      where,
      relations: ['table', 'table.area', 'branch', 'customer', 'items'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Every running order in the branch (any type/status still in progress),
   * newest first — powers the POS "load an open order" picker. Unlike the KDS
   * board this is never assignee-filtered: the POS operator settles any table.
   */
  listActive(branchId?: string): Promise<Order[]> {
    return this.repository.find({
      where: {
        status: In([...ACTIVE_STATUSES, 'out-for-delivery'] as OrderStatus[]),
        ...(branchId ? { branchId } : {}),
      },
      relations: ['table', 'table.area', 'branch', 'customer', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Which assignment column (if any) a user's board is filtered by. Managers,
   * owners and super admins see everything (null); a chef/waiter/rider is scoped
   * to the orders assigned to them.
   */
  private assigneeScope(user?: AuthenticatedUser): {
    column: 'assignedChefId' | 'assignedWaiterId' | 'assignedRiderId';
    userId: string;
  } | null {
    if (!user || user.isSuperAdmin) return null;
    const roles = new Set(user.roleNames ?? []);
    if (
      roles.has('Owner') ||
      roles.has('Multi Branch Manager') ||
      roles.has('Branch Manager')
    ) {
      return null;
    }
    if (roles.has('Chef')) return { column: 'assignedChefId', userId: user.id };
    if (roles.has('Waiter'))
      return { column: 'assignedWaiterId', userId: user.id };
    if (roles.has('Delivery Rider'))
      return { column: 'assignedRiderId', userId: user.id };
    return null;
  }

  /**
   * Re-price items against the live menu so a client can never dictate the
   * price. **Untrusted** callers (guests placing storefront/QR orders) must
   * reference a real, available menu item; its unit price becomes the DB base
   * price plus any add-on premium, bounded to what the item's real options
   * allow — so `unitPrice` can neither drop below base (free food) nor be
   * inflated. **Trusted** callers — authenticated staff (POS: manual discounts,
   * custom lines) and external aggregators (provider is authoritative, flagged
   * by `dto.source`) — keep their prices.
   */
  private async securePriceItems(
    dto: CreateOrderDto,
    trusted: boolean,
  ): Promise<CreateOrderDto['items']> {
    if (trusted) return dto.items;

    const ids = [
      ...new Set(
        dto.items.map((i) => i.menuItemId).filter((v): v is string => !!v),
      ),
    ];
    const menu = ids.length
      ? await this._menuItems.find({ where: { id: In(ids) } })
      : [];
    const byId = new Map(menu.map((m) => [m.id, m]));

    return dto.items.map((it) => {
      if (!it.menuItemId) {
        throw new BadRequestException('Every item must reference a menu item.');
      }
      const mi = byId.get(it.menuItemId);
      if (!mi) throw new BadRequestException(`Menu item not found: ${it.name}`);
      if (!mi.isAvailable)
        throw new BadRequestException(`"${mi.name}" is sold out.`);

      const base = mi.price ?? 0;
      const options = [
        ...(mi.sizes ?? []),
        ...(mi.variants ?? []),
        ...(mi.addOns ?? []),
      ];
      const maxPremium = options.reduce((s, o) => s + (o.price ?? 0), 0);
      const claimedPremium = round2((it.unitPrice ?? base) - base);
      const premium = Math.min(Math.max(claimedPremium, 0), maxPremium);
      return { ...it, unitPrice: round2(base + premium) };
    });
  }

  async createOrder(
    dto: CreateOrderDto,
    actor?: AuthenticatedUser,
    opts: { initialStatus?: OrderStatus } = {},
  ): Promise<Order> {
    await this._validator.validateCreate(dto);
    // Trusted = authenticated staff (POS) or an external aggregator (dto.source).
    // Everyone else is an untrusted guest and gets re-priced + payment-locked.
    const trusted = !!actor?.id || !!dto.source;
    const items = await this.securePriceItems(dto, trusted);
    const payload = this._helper.resolveCreatePayload(
      { ...dto, items },
      { trusted, initialStatus: opts.initialStatus },
    );

    // Server-authoritative promo: when a code is supplied we re-validate it
    // against the computed subtotal and apply the discount ourselves — the
    // client's amount is never trusted. (Manual POS discounts, sent as
    // `dto.discount` with no code, pass through untouched via the helper.)
    let redeem: {
      promotionId: string;
      code: string | null;
      discountAmount: number;
    } | null = null;
    if (dto.promotionCode) {
      const subtotal = payload.subtotal ?? 0;
      const result = await this._promotions.validateCode({
        code: dto.promotionCode,
        subtotal,
        customerId: dto.customerId,
      });
      const discount = result.valid ? result.discountAmount : 0;
      payload.discount = discount;
      payload.total = round2(
        subtotal + (payload.tax ?? 0) + (payload.deliveryFee ?? 0) - discount,
      );
      if (result.valid && result.promotion) {
        payload.promotionId = result.promotion.id;
        payload.promotionCode = result.promotion.code;
        redeem = {
          promotionId: result.promotion.id,
          code: result.promotion.code,
          discountAmount: discount,
        };
      }
    }

    const saved = await this.create(payload);
    if (redeem) {
      await this._promotions.redeem({
        ...redeem,
        customerId: dto.customerId ?? null,
        orderId: saved.id,
      });
    }
    const order = await this.getById(saved.id);
    this.emitOrder(order, 'order.created');
    // A prepay order that hasn't been paid yet stays invisible to the kitchen
    // and the floor (no board event, no "new order" bell) until it's confirmed.
    if (order.status !== 'pending_payment') {
      this.emitBoard(order);
      await this.notify(order, 'placed');
    }
    return order;
  }

  /**
   * Confirm payment on a prepay ('pending_payment') dine-in order — called by
   * the payment-gateway webhook (Phase 2) or a staff manual confirmation. Flips
   * the order live: `placed` + `paid`, then fans it out to the kitchen board and
   * the floor exactly as a normal new order would. No-op for any other status.
   */
  async confirmDineInPayment(id: string): Promise<Order> {
    const existing = await this._validator.ensureExists(id);
    if (existing.status !== 'pending_payment') {
      return this.getById(id);
    }
    await this.repository.update(id, {
      status: 'placed',
      paymentStatus: 'paid',
    });
    const order = await this.getById(id);
    this.emitOrder(order, 'order.updated');
    this.emitBoard(order);
    await this.notify(order, 'placed');
    return order;
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
    const existing = await this._validator.ensureExists(id);

    const patch: Partial<Order> = {};
    if (dto.status !== undefined) {
      patch.status = dto.status;
      // Keep the cancellation reason only while the order is cancelled; a
      // status change away from `cancelled` clears it.
      patch.cancellationReason =
        dto.status === 'cancelled' ? (dto.cancellationReason ?? null) : null;
    } else if (dto.cancellationReason !== undefined) {
      patch.cancellationReason = dto.cancellationReason || null;
    }
    if (dto.paymentStatus !== undefined)
      patch.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod !== undefined)
      patch.paymentMethod = dto.paymentMethod || null;
    if (dto.customerName !== undefined) patch.customerName = dto.customerName;
    if (dto.customerPhone !== undefined)
      patch.customerPhone = dto.customerPhone;
    if (dto.customerAddress !== undefined)
      patch.customerAddress = dto.customerAddress;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.tableId !== undefined) patch.tableId = dto.tableId || null;

    if (dto.items) {
      // Recompute money for the replacement line items (no writes yet).
      const rows = dto.items.map((it) =>
        this._itemRepo.create({
          orderId: id,
          menuItemId: it.menuItemId ?? null,
          name: it.name,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          lineTotal: round2(it.unitPrice * it.quantity),
          notes: it.notes ?? null,
        }),
      );
      const subtotal = round2(rows.reduce((s, r) => s + (r.lineTotal ?? 0), 0));
      const tax = round2(dto.tax ?? existing.tax);
      const discount = round2(dto.discount ?? existing.discount);
      patch.subtotal = subtotal;
      patch.tax = tax;
      patch.discount = discount;
      patch.total = round2(subtotal + tax - discount);

      // Atomic: drop the old items, insert the new ones, and apply the order
      // patch together — a failure mid-way must not leave a half-replaced order.
      await this._transactionService.execute(async (queryRunner) => {
        await queryRunner.manager.delete(OrderItem, { orderId: id });
        if (rows.length) await queryRunner.manager.save(OrderItem, rows);
        await queryRunner.manager.update(Order, id, patch);
      });
    } else {
      if (dto.tax !== undefined) patch.tax = round2(dto.tax);
      if (dto.discount !== undefined) {
        patch.discount = round2(dto.discount);
        patch.total = round2(
          existing.subtotal + (patch.tax ?? existing.tax) - patch.discount,
        );
      }
      if (Object.keys(patch).length) await this.repository.update(id, patch);
    }
    const order = await this.getById(id);
    if (dto.status !== undefined) {
      this.emitOrder(order, 'order.updated');
      this.emitBoard(order);
      // Only fire the "ready" nudge when the status actually transitions to ready.
      if (order.status === 'ready' && existing.status !== 'ready') {
        await this.notify(order, 'ready');
      }
      // Relay the new status back to the source aggregator (foodpanda, …).
      if (order.status !== existing.status) {
        await this._statusSync.syncOutbound(order);
      }
    }
    return order;
  }

  /** The current open order for a table (for loading into the POS to edit). */
  getActiveByTable(tableId: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { tableId, status: In(ACTIVE_STATUSES) },
      relations: ['table', 'table.area', 'branch', 'customer', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * The table's full running bill: EVERY active order (round) on the table,
   * merged into one session so a guest who ordered again ("a water bottle after
   * being served") sees a single, complete bill. Excludes `pending_payment`
   * (unconfirmed prepay) — those aren't part of the settle-at-table bill.
   */
  async getTableSessionBill(tableId: string): Promise<TableSessionBill | null> {
    const orders = await this.repository.find({
      where: { tableId, status: In(ACTIVE_STATUSES) },
      relations: ['table', 'items'],
      order: { createdAt: 'ASC' },
    });
    if (orders.length === 0) return null;

    const rounds: TableSessionRound[] = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus === 'paid' ? 'paid' : 'unpaid',
      createdAt: String(o.createdAt),
      total: o.total,
      items: (o.items ?? []).map((it) => ({
        id: it.id,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        notes: it.notes ?? null,
      })),
    }));

    // Merge identical lines (same name + unit price) across every round.
    const merged = new Map<
      string,
      { name: string; quantity: number; unitPrice: number; lineTotal: number }
    >();
    for (const o of orders) {
      for (const it of o.items ?? []) {
        const key = `${it.name}|${it.unitPrice}`;
        const ex = merged.get(key);
        if (ex) {
          ex.quantity += it.quantity;
          ex.lineTotal = round2(ex.lineTotal + it.lineTotal);
        } else {
          merged.set(key, {
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
          });
        }
      }
    }

    const subtotal = round2(orders.reduce((s, o) => s + o.subtotal, 0));
    const tax = round2(orders.reduce((s, o) => s + o.tax, 0));
    const total = round2(orders.reduce((s, o) => s + o.total, 0));
    const amountPaid = round2(
      orders
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((s, o) => s + o.total, 0),
    );
    const amountDue = round2(total - amountPaid);
    const paymentStatus =
      amountDue <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

    return {
      tableId,
      tableName: orders[0].table?.name ?? null,
      branchId: orders[0].branchId ?? null,
      orderCount: orders.length,
      rounds,
      items: [...merged.values()],
      subtotal,
      tax,
      total,
      amountPaid,
      amountDue,
      paymentStatus,
    };
  }

  /**
   * Close a table's session — settle every active order (all rounds) on it and
   * free the table. `markPaid` true (default) settles as paid; false records a
   * walkout/comp (completed, left unpaid). Emits one board + floor nudge.
   */
  async closeTableSession(
    tableId: string,
    markPaid = true,
  ): Promise<{ closed: number; total: number }> {
    const orders = await this.repository.find({
      where: { tableId, status: In(ACTIVE_STATUSES) },
    });
    let total = 0;
    // Atomic: either every round on the table settles, or none does — a partial
    // close would leave the bill inconsistent.
    if (orders.length > 0) {
      await this._transactionService.execute(async (queryRunner) => {
        for (const o of orders) {
          await queryRunner.manager.update(Order, o.id, {
            status: 'completed',
            ...(markPaid ? { paymentStatus: 'paid' } : {}),
          });
          total = round2(total + o.total);
        }
      });
    }
    if (orders.length > 0) {
      this._realtime.publish(
        boardChannel(this._req.tenant?.id),
        'board.changed',
        { tableId },
      );
      this._realtime.publish(
        tablesChannel(this._req.tenant?.id),
        'tables.changed',
        { tableId },
      );
    }
    // End the dine-in sitting: invalidate its per-sitting token so a returning
    // customer's saved link can no longer add to this (now settled) table.
    await this._tableSessions.update(
      { tableId, status: 'open' },
      { status: 'closed', closedAt: new Date() },
    );
    return { closed: orders.length, total };
  }

  /** Live per-table aggregation used by the Tables board (occupied / KOT / totals). */
  async getTableStats(branchId?: string): Promise<TableStat[]> {
    const orders = await this.repository.find({
      where: { status: In(ACTIVE_STATUSES), ...(branchId ? { branchId } : {}) },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    const byTable = new Map<string, TableStat>();
    for (const order of orders) {
      if (!order.tableId) continue;
      const existing = byTable.get(order.tableId);
      const itemCount = (order.items ?? []).reduce(
        (n, it) => n + it.quantity,
        0,
      );
      const isKot = order.status === 'preparing';

      if (!existing) {
        // Orders are DESC by createdAt, so the first seen is the latest.
        byTable.set(order.tableId, {
          tableId: order.tableId,
          status: isKot ? 'kot' : 'occupied',
          orderStatus: order.status,
          orderCount: 1,
          itemCount,
          total: order.total,
          lastOrderAt: String(order.createdAt),
        });
      } else {
        existing.orderCount += 1;
        existing.itemCount += itemCount;
        existing.total = Math.round((existing.total + order.total) * 100) / 100;
        if (isKot) existing.status = 'kot';
      }
    }

    return Array.from(byTable.values());
  }
}
