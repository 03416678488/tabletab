import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderValidatorService } from './services/order-validator.service';
import { OrderHelperService } from './services/order.helper.service';
import { CreateOrderDto, UpdateOrderDto, GetOrderQueryDto } from './dto';

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
    protected readonly pagination: PaginationProvider,
    private readonly _validator: OrderValidatorService,
    private readonly _helper: OrderHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetOrderQueryDto): Promise<Paginated<Order>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [
      'table',
      'table.area',
      'branch',
      'customer',
      'items',
    ]);
  }

  getById(id: string): Promise<Order> {
    return this._validator.ensureExists(id);
  }

  /** Live kitchen/pickup board — active orders oldest-first, with everything needed to render a ticket. */
  getBoard(): Promise<Order[]> {
    return this.repository.find({
      where: { status: In(BOARD_STATUSES) },
      relations: ['table', 'table.area', 'branch', 'customer', 'items'],
      order: { createdAt: 'ASC' },
    });
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    return this.getById(saved.id);
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
    const existing = await this._validator.ensureExists(id);

    const patch: Partial<Order> = {};
    if (dto.status !== undefined) patch.status = dto.status;
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
    return this.getById(id);
  }

  /** The current open order for a table (for loading into the POS to edit). */
  getActiveByTable(tableId: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { tableId, status: In(ACTIVE_STATUSES) },
      relations: ['table', 'table.area', 'branch', 'customer', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteOrder(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }

  /** Live per-table aggregation used by the Tables board (occupied / KOT / totals). */
  async getTableStats(): Promise<TableStat[]> {
    const orders = await this.repository.find({
      where: { status: In(ACTIVE_STATUSES) },
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
