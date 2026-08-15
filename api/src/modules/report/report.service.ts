import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';

import { Order } from '@modules/order/entities/order.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface SalesReport {
  from: string;
  to: string;
  totals: {
    salesTotal: number;
    ordersCount: number;
    avgOrder: number;
    subtotalTotal: number;
    discountTotal: number;
    taxTotal: number;
    reservationTotal: number;
    reservationCount: number;
    eventTotal: number;
    eventCount: number;
    netProfit: number;
  };
  byType: { type: string; count: number; total: number }[];
  byMethod: { method: string; count: number; total: number }[];
  byDay: { day: string; count: number; total: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Order)
    private readonly _orderRepo: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly _txnRepo: Repository<Transaction>,
  ) {}

  async getSalesReport(fromStr?: string, toStr?: string): Promise<SalesReport> {
    const from = fromStr
      ? new Date(fromStr)
      : new Date(Date.now() - 30 * 864e5);
    const to = toStr ? new Date(toStr) : new Date();

    const orders = await this._orderRepo.find({
      where: { createdAt: Between(from, to), status: Not('cancelled') },
      relations: ['items'],
    });

    let salesTotal = 0;
    let subtotalTotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    const byType = new Map<string, { count: number; total: number }>();
    const byDay = new Map<string, { count: number; total: number }>();
    const topItems = new Map<string, { qty: number; revenue: number }>();

    for (const o of orders) {
      salesTotal += o.total;
      subtotalTotal += o.subtotal;
      discountTotal += o.discount;
      taxTotal += o.tax;

      const t = byType.get(o.orderType) ?? { count: 0, total: 0 };
      t.count += 1;
      t.total += o.total;
      byType.set(o.orderType, t);

      const day = String(o.createdAt).slice(0, 10);
      const d = byDay.get(day) ?? { count: 0, total: 0 };
      d.count += 1;
      d.total += o.total;
      byDay.set(day, d);

      for (const it of o.items ?? []) {
        const ti = topItems.get(it.name) ?? { qty: 0, revenue: 0 };
        ti.qty += it.quantity;
        ti.revenue += it.lineTotal;
        topItems.set(it.name, ti);
      }
    }

    // Payment-method breakdown from earning transactions in range — order sales
    // plus reservation deposits and event payments (all money taken in).
    const [sales, deposits, eventPayments] = await Promise.all([
      this._txnRepo.find({
        where: { type: 'sale', createdAt: Between(from, to) },
      }),
      this._txnRepo.find({
        where: { type: 'reservation_deposit', createdAt: Between(from, to) },
      }),
      this._txnRepo.find({
        where: { type: 'event_payment', createdAt: Between(from, to) },
      }),
    ]);
    const byMethod = new Map<string, { count: number; total: number }>();
    for (const s of [...sales, ...deposits, ...eventPayments]) {
      const m = byMethod.get(s.method) ?? { count: 0, total: 0 };
      m.count += 1;
      m.total += s.amount;
      byMethod.set(s.method, m);
    }

    const reservationTotal = deposits.reduce((sum, d) => sum + d.amount, 0);
    const reservationCount = deposits.length;
    const eventTotal = eventPayments.reduce((sum, e) => sum + e.amount, 0);
    const eventCount = eventPayments.length;

    // Total money taken in across sales and ancillary earnings in range.
    const netProfit = salesTotal + reservationTotal + eventTotal;

    const ordersCount = orders.length;
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totals: {
        salesTotal: round2(salesTotal),
        ordersCount,
        avgOrder: ordersCount ? round2(salesTotal / ordersCount) : 0,
        subtotalTotal: round2(subtotalTotal),
        discountTotal: round2(discountTotal),
        taxTotal: round2(taxTotal),
        reservationTotal: round2(reservationTotal),
        reservationCount,
        eventTotal: round2(eventTotal),
        eventCount,
        netProfit: round2(netProfit),
      },
      byType: [...byType.entries()].map(([type, v]) => ({
        type,
        count: v.count,
        total: round2(v.total),
      })),
      byMethod: [...byMethod.entries()].map(([method, v]) => ({
        method,
        count: v.count,
        total: round2(v.total),
      })),
      byDay: [...byDay.entries()]
        .map(([day, v]) => ({ day, count: v.count, total: round2(v.total) }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      topItems: [...topItems.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, revenue: round2(v.revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };
  }
}
