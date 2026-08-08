import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { boardChannel, orderChannel, tablesChannel } from '@modules/realtime/channels';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';
import { OrderValidatorService } from './services/order-validator.service';
import { OrderHelperService } from './services/order.helper.service';
import { CreateOrderDto, UpdateOrderDto, GetOrderQueryDto } from './dto';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { NotificationService } from '@modules/notification/notification.service';
import { OrderStatusSyncService } from './services/order-status-sync.service';
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
const BOARD_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready'];

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
  items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
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
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /** Push a minimal status event to the order's tracking channel (post-commit). */
  private emitOrder(order: Order, type: 'order.created' | 'order.updated'): void {
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
    this._realtime.publish(boardChannel(this._req.tenant?.id), 'board.changed', {
      orderId: order.id,
      status: order.status,
    });
    // A table order shifts floor occupancy — nudge the floor views too.
    if (order.tableId) {
      this._realtime.publish(tablesChannel(this._req.tenant?.id), 'tables.changed', {
        tableId: order.tableId,
      });
    }
  }

  /**
   * Fan a bell notification out to the relevant staff roles (best-effort — a
   * notification failure must never break the order flow). Phase 1: new orders
   * and ready-to-serve; targeting is by role (branch scoping comes later).
   */
  private async notify(order: Order, kind: 'placed' | 'ready'): Promise<void> {
    const where = order.table?.name ?? order.customerName ?? order.orderType;
    const summary = `${order.items?.length ?? 0} item${order.items?.length === 1 ? '' : 's'} · ${where}`;
    try {
      const data = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        status: order.status,
      };
      if (kind === 'placed') {
        await this._notifications.notifyRoles(
          ['Owner', 'Multi Branch Manager', 'Branch Manager', 'Chef', 'Waiter'],
          {
            category: 'orders',
            type: 'order.placed',
            title: `New order ${order.orderNumber}`,
            body: summary,
            data,
            priority: 'normal',
            branchId: order.branchId ?? null,
          },
        );
      } else {
        await this._notifications.notifyRoles(['Waiter', 'Delivery Rider'], {
          category: 'orders',
          type: 'order.ready',
          title: `Order ${order.orderNumber} is ready`,
          body: summary,
          data,
          priority: 'high',
          branchId: order.branchId ?? null,
        });
      }
    } catch (err) {
      console.warn('[notify] order notification failed', (err as Error).message);
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
  getBoard(branchId?: string): Promise<Order[]> {
    return this.repository.find({
      where: { status: In(BOARD_STATUSES), ...(branchId ? { branchId } : {}) },
      relations: ['table', 'table.area', 'branch', 'customer', 'items'],
      order: { createdAt: 'ASC' },
    });
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
      ...new Set(dto.items.map((i) => i.menuItemId).filter((v): v is string => !!v)),
    ];
    const menu = ids.length ? await this._menuItems.find({ where: { id: In(ids) } }) : [];
    const byId = new Map(menu.map((m) => [m.id, m]));

    return dto.items.map((it) => {
      if (!it.menuItemId) {
        throw new BadRequestException('Every item must reference a menu item.');
      }
      const mi = byId.get(it.menuItemId);
      if (!mi) throw new BadRequestException(`Menu item not found: ${it.name}`);
      if (!mi.isAvailable) throw new BadRequestException(`"${mi.name}" is sold out.`);

      const base = mi.price ?? 0;
      const options = [...(mi.sizes ?? []), ...(mi.variants ?? []), ...(mi.addOns ?? [])];
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
    let redeem: { promotionId: string; code: string | null; discountAmount: number } | null = null;
    if (dto.promotionCode) {
      const subtotal = payload.subtotal ?? 0;
      const result = await this._promotions.validateCode({
        code: dto.promotionCode,
        subtotal,
        customerId: dto.customerId,
      });
      const discount = result.valid ? result.discountAmount : 0;
      payload.discount = discount;
      payload.total = round2(subtotal + (payload.tax ?? 0) + (payload.deliveryFee ?? 0) - discount);
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
    await this.repository.update(id, { status: 'placed', paymentStatus: 'paid' });
    const order = await this.getById(id);
    this.emitOrder(order, 'order.updated');
    this.emitBoard(order);
    await this.notify(order, 'placed');
    return order;
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
    const existing = await this._validator.ensureExists(id);

    const patch: Partial<Order> = {};
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.paymentStatus !== undefined) patch.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod !== undefined) patch.paymentMethod = dto.paymentMethod || null;
    if (dto.customerName !== undefined) patch.customerName = dto.customerName;
    if (dto.customerPhone !== undefined) patch.customerPhone = dto.customerPhone;
    if (dto.customerAddress !== undefined) patch.customerAddress = dto.customerAddress;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.tableId !== undefined) patch.tableId = dto.tableId || null;

    if (dto.items) {
      // Replace the line items and recompute money.
      await this._itemRepo.delete({ orderId: id });
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
      if (rows.length) await this._itemRepo.save(rows);

      const subtotal = round2(rows.reduce((s, r) => s + (r.lineTotal ?? 0), 0));
      const tax = round2(dto.tax ?? existing.tax);
      const discount = round2(dto.discount ?? existing.discount);
      patch.subtotal = subtotal;
      patch.tax = tax;
      patch.discount = discount;
      patch.total = round2(subtotal + tax - discount);
    } else {
      if (dto.tax !== undefined) patch.tax = round2(dto.tax);
      if (dto.discount !== undefined) {
        patch.discount = round2(dto.discount);
        patch.total = round2(
          existing.subtotal + (patch.tax ?? existing.tax) - patch.discount,
        );
      }
    }

    if (Object.keys(patch).length) await this.repository.update(id, patch);
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
    const merged = new Map<string, { name: string; quantity: number; unitPrice: number; lineTotal: number }>();
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
      orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
    );
    const amountDue = round2(total - amountPaid);
    const paymentStatus = amountDue <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

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
    for (const o of orders) {
      await this.repository.update(o.id, {
        status: 'completed',
        ...(markPaid ? { paymentStatus: 'paid' } : {}),
      });
      total = round2(total + o.total);
    }
    if (orders.length > 0) {
      this._realtime.publish(boardChannel(this._req.tenant?.id), 'board.changed', { tableId });
      this._realtime.publish(tablesChannel(this._req.tenant?.id), 'tables.changed', { tableId });
    }
    return { closed: orders.length, total };
  }

  async deleteOrder(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
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
      const itemCount = (order.items ?? []).reduce((n, it) => n + it.quantity, 0);
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
