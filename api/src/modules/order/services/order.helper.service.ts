import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CreateOrderDto, GetOrderQueryDto } from '../dto';
import { toILikeContains } from '@cor/helpers/query.helper';

/** Pure resolver helpers — order-number, totals and query building. */
@Injectable()
export class OrderHelperService {
  /** Short human-friendly reference, e.g. ORD-8F3A2C. */
  generateOrderNumber(): string {
    return `ORD-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  resolveCreatePayload(
    dto: CreateOrderDto,
    opts: { trusted?: boolean; initialStatus?: Order['status'] } = {},
  ): Partial<Order> {
    const trusted = opts.trusted ?? false;
    const items: Partial<OrderItem>[] = dto.items.map((it) => ({
      menuItemId: it.menuItemId ?? null,
      name: trimSpaces(it.name),
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      lineTotal: round2(it.unitPrice * it.quantity),
      notes: it.notes ? trimSpaces(it.notes) : null,
    }));

    const subtotal = round2(items.reduce((sum, it) => sum + (it.lineTotal ?? 0), 0));
    // Untrusted (guest) money fields are sanity-bounded so they can't be gamed:
    // tax/discount never exceed the subtotal and can't go negative. Trusted
    // callers (staff POS / aggregators) keep their values as sent.
    const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max);
    const rawTax = round2(dto.tax ?? 0);
    const rawDiscount = round2(dto.discount ?? 0);
    const rawFee = round2(dto.deliveryFee ?? 0);
    const tax = trusted ? rawTax : clamp(rawTax, subtotal);
    const discount = trusted ? rawDiscount : clamp(rawDiscount, subtotal);
    const deliveryFee = trusted ? rawFee : Math.max(rawFee, 0);
    const total = round2(subtotal + tax + deliveryFee - discount);

    return {
      orderNumber: this.generateOrderNumber(),
      orderType: dto.orderType,
      source: dto.source ?? null,
      externalRef: dto.externalRef ?? null,
      status: opts.initialStatus ?? 'placed',
      tableId: dto.tableId ?? null,
      branchId: dto.branchId ?? null,
      customerId: dto.customerId ?? null,
      customerName: dto.customerName ? trimSpaces(dto.customerName) : null,
      customerPhone: dto.customerPhone ?? null,
      customerAddress: dto.customerAddress ? trimSpaces(dto.customerAddress) : null,
      customerLat: dto.customerLat ?? null,
      customerLng: dto.customerLng ?? null,
      paymentMethod: dto.paymentMethod ? trimSpaces(dto.paymentMethod) : null,
      // Online is paid at checkout; POS/dine-in default unpaid unless the client
      // says otherwise (e.g. POS "pay now"). A guest can NEVER self-declare a
      // dine-in order as paid — that's settled at the table or via the gateway,
      // never trusted from the request body.
      paymentStatus:
        !trusted && dto.orderType === 'table'
          ? 'unpaid'
          : (dto.paymentStatus ?? (dto.orderType === 'online' ? 'paid' : 'unpaid')),
      notes: dto.notes ? trimSpaces(dto.notes) : null,
      subtotal,
      tax,
      discount,
      deliveryFee,
      total,
      promotionId: null,
      promotionCode: null,
      items: items as OrderItem[],
    };
  }

  resolveListFilters(
    query: GetOrderQueryDto,
  ): FindOptionsWhere<Order> | FindOptionsWhere<Order>[] {
    // Base (AND) filters applied to every search branch.
    const base: FindOptionsWhere<Order> = {};
    if (query.orderType) base.orderType = query.orderType as Order['orderType'];
    if (query.status) base.status = query.status as Order['status'];
    if (query.paymentStatus) base.paymentStatus = query.paymentStatus as Order['paymentStatus'];
    if (query.tableId) base.tableId = query.tableId;
    if (query.branchId) base.branchId = query.branchId;
    if (query.customerId) base.customerId = query.customerId;

    const term = query.search ? trimSpaces(query.search) : '';
    if (!term) return base;

    // Search across the columns a user might type: order #, customer name/phone,
    // and the table name. Each branch keeps the base filters (OR of ANDs).
    const like = toILikeContains(term);
    return [
      { ...base, orderNumber: like },
      { ...base, customerName: like },
      { ...base, customerPhone: like },
      { ...base, table: { name: like } },
    ];
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
