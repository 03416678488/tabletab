import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CreateOrderDto, GetOrderQueryDto } from '../dto';

/** Pure resolver helpers — order-number, totals and query building. */
@Injectable()
export class OrderHelperService {
  /** Short human-friendly reference, e.g. ORD-8F3A2C. */
  generateOrderNumber(): string {
    return `ORD-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  resolveCreatePayload(dto: CreateOrderDto): Partial<Order> {
    const items: Partial<OrderItem>[] = dto.items.map((it) => ({
      menuItemId: it.menuItemId ?? null,
      name: trimSpaces(it.name),
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      lineTotal: round2(it.unitPrice * it.quantity),
      notes: it.notes ? trimSpaces(it.notes) : null,
    }));

    const subtotal = round2(items.reduce((sum, it) => sum + (it.lineTotal ?? 0), 0));
    const tax = round2(dto.tax ?? 0);
    const discount = round2(dto.discount ?? 0);
    const deliveryFee = round2(dto.deliveryFee ?? 0);
    const total = round2(subtotal + tax + deliveryFee - discount);

    return {
      orderNumber: this.generateOrderNumber(),
      orderType: dto.orderType,
      status: 'placed',
      tableId: dto.tableId ?? null,
      branchId: dto.branchId ?? null,
      customerId: dto.customerId ?? null,
      customerName: dto.customerName ? trimSpaces(dto.customerName) : null,
      customerPhone: dto.customerPhone ?? null,
      customerAddress: dto.customerAddress ? trimSpaces(dto.customerAddress) : null,
      notes: dto.notes ? trimSpaces(dto.notes) : null,
      subtotal,
      tax,
      discount,
      deliveryFee,
      total,
      items: items as OrderItem[],
    };
  }

  resolveListFilters(query: GetOrderQueryDto): FindOptionsWhere<Order> {
    const where: FindOptionsWhere<Order> = {};
    if (query.search) where.orderNumber = ILike(`%${trimSpaces(query.search)}%`);
    if (query.orderType) where.orderType = query.orderType as Order['orderType'];
    if (query.status) where.status = query.status as Order['status'];
    if (query.tableId) where.tableId = query.tableId;
    if (query.branchId) where.branchId = query.branchId;
    return where;
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
