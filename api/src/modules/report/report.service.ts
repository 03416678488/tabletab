import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';

import { Order } from '@modules/order/entities/order.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type ReportGranularity = 'day' | 'week' | 'month';

/** The headline figures — computed for the current period and the previous one. */
export interface ReportTotals {
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
}

export interface SalesReport {
  from: string;
  to: string;
  granularity: ReportGranularity;
  totals: ReportTotals;
  /** Same-length window immediately before `from`, for period-over-period deltas. */
  previous: ReportTotals;
  byType: { type: string; count: number; total: number }[];
  byMethod: { method: string; count: number; total: number }[];
  /** Time series bucketed by `granularity` (label = day/week-start/month). */
  byDay: { day: string; count: number; total: number }[];
  byBranch: {
    branchId: string;
    branchName: string;
    count: number;
    total: number;
  }[];
  /** Revenue by hour-of-day (0–23, server time) for peak-hour staffing. */
  byHour: { hour: number; count: number; total: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Order)
    private readonly _orderRepo: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly _txnRepo: Repository<Transaction>,
    @InjectRepository(Branch)
    private readonly _branchRepo: Repository<Branch>,
  ) {}

  async getSalesReport(
    fromStr?: string,
    toStr?: string,
    branchId?: string,
    granularityStr?: string,
  ): Promise<SalesReport> {
    const from = fromStr
      ? new Date(fromStr)
      : new Date(Date.now() - 30 * 864e5);
    const to = toStr ? new Date(toStr) : new Date();
    const granularity: ReportGranularity =
      granularityStr === 'week' || granularityStr === 'month'
        ? granularityStr
        : 'day';

    const orders = await this._orderRepo.find({
      where: {
        createdAt: Between(from, to),
        status: Not('cancelled'),
        ...(branchId ? { branchId } : {}),
      },
      relations: ['items'],
    });

    let salesTotal = 0;
    let subtotalTotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    const byType = new Map<string, { count: number; total: number }>();
    const byBucket = new Map<string, { count: number; total: number }>();
    const byBranch = new Map<string, { count: number; total: number }>();
    const byHour = new Map<number, { count: number; total: number }>();
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

      const iso = String(o.createdAt);
      const bucket = this.bucketKey(iso, granularity);
      const d = byBucket.get(bucket) ?? { count: 0, total: 0 };
      d.count += 1;
      d.total += o.total;
      byBucket.set(bucket, d);

      const hour = Number(iso.slice(11, 13)) || 0;
      const h = byHour.get(hour) ?? { count: 0, total: 0 };
      h.count += 1;
      h.total += o.total;
      byHour.set(hour, h);

      const bk = o.branchId ?? '';
      const b = byBranch.get(bk) ?? { count: 0, total: 0 };
      b.count += 1;
      b.total += o.total;
      byBranch.set(bk, b);

      for (const it of o.items ?? []) {
        const ti = topItems.get(it.name) ?? { qty: 0, revenue: 0 };
        ti.qty += it.quantity;
        ti.revenue += it.lineTotal;
        topItems.set(it.name, ti);
      }
    }

    // Payment-method breakdown from earning transactions in range — order sales
    // plus reservation deposits and event payments (all money taken in). Sale
    // transactions have no branch of their own (they derive it from the order),
    // so branch-scope them by joining the order; ancillary earnings carry their
    // own branchId.
    const salesQb = this._txnRepo
      .createQueryBuilder('t')
      .where('t.type = :type', { type: 'sale' })
      .andWhere('t."createdAt" BETWEEN :from AND :to', { from, to });
    if (branchId) {
      salesQb
        .innerJoin(Order, 'o', 'o.id = t."orderId"')
        .andWhere('o."branchId" = :branchId', { branchId });
    }

    const [sales, deposits, eventPayments, branches, previous] =
      await Promise.all([
        salesQb.getMany(),
        this._txnRepo.find({
          where: {
            type: 'reservation_deposit',
            createdAt: Between(from, to),
            ...(branchId ? { branchId } : {}),
          },
        }),
        this._txnRepo.find({
          where: {
            type: 'event_payment',
            createdAt: Between(from, to),
            ...(branchId ? { branchId } : {}),
          },
        }),
        this._branchRepo.find({ select: { id: true, name: true } }),
        this.previousTotals(from, to, branchId),
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
    const ordersCount = orders.length;
    const netProfit = salesTotal + reservationTotal + eventTotal;

    const branchName = new Map(branches.map((b) => [b.id, b.name]));

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
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
      previous,
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
      byDay: [...byBucket.entries()]
        .map(([day, v]) => ({ day, count: v.count, total: round2(v.total) }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      byBranch: [...byBranch.entries()]
        .map(([id, v]) => ({
          branchId: id,
          branchName: branchName.get(id) ?? 'Unassigned',
          count: v.count,
          total: round2(v.total),
        }))
        .sort((a, b) => b.total - a.total),
      byHour: Array.from({ length: 24 }, (_, hour) => {
        const v = byHour.get(hour) ?? { count: 0, total: 0 };
        return { hour, count: v.count, total: round2(v.total) };
      }),
      topItems: [...topItems.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, revenue: round2(v.revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };
  }

  /** Headline totals for the same-length window immediately before `from`. */
  private async previousTotals(
    from: Date,
    to: Date,
    branchId?: string,
  ): Promise<ReportTotals> {
    const span = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - span);
    const prevTo = new Date(from.getTime());

    const orderQb = this._orderRepo
      .createQueryBuilder('o')
      .where('o."createdAt" BETWEEN :from AND :to', {
        from: prevFrom,
        to: prevTo,
      })
      .andWhere("o.status <> 'cancelled'")
      .select('COALESCE(SUM(o.total), 0)', 'sales')
      .addSelect('COUNT(*)', 'cnt');
    if (branchId) orderQb.andWhere('o."branchId" = :branchId', { branchId });
    const orderRow = await orderQb.getRawOne<{ sales: string; cnt: string }>();

    const ancTotal = async (type: string): Promise<number> => {
      const qb = this._txnRepo
        .createQueryBuilder('t')
        .where('t.type = :type', { type })
        .andWhere('t."createdAt" BETWEEN :from AND :to', {
          from: prevFrom,
          to: prevTo,
        })
        .select('COALESCE(SUM(t.amount), 0)', 'sum');
      if (branchId) qb.andWhere('t."branchId" = :branchId', { branchId });
      const row = await qb.getRawOne<{ sum: string }>();
      return Number(row?.sum ?? 0);
    };

    const salesTotal = Number(orderRow?.sales ?? 0);
    const ordersCount = Number(orderRow?.cnt ?? 0);
    const reservationTotal = await ancTotal('reservation_deposit');
    const eventTotal = await ancTotal('event_payment');

    return {
      salesTotal: round2(salesTotal),
      ordersCount,
      avgOrder: ordersCount ? round2(salesTotal / ordersCount) : 0,
      subtotalTotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      reservationTotal: round2(reservationTotal),
      reservationCount: 0,
      eventTotal: round2(eventTotal),
      eventCount: 0,
      netProfit: round2(salesTotal + reservationTotal + eventTotal),
    };
  }

  /** Bucket label for a timestamp: day (YYYY-MM-DD), ISO-week Monday, or month. */
  private bucketKey(iso: string, granularity: ReportGranularity): string {
    if (granularity === 'month') return iso.slice(0, 7); // YYYY-MM
    if (granularity === 'week') {
      const d = new Date(iso);
      const day = d.getUTCDay(); // 0=Sun … 6=Sat
      const shift = day === 0 ? -6 : 1 - day; // back to Monday
      d.setUTCDate(d.getUTCDate() + shift);
      return d.toISOString().slice(0, 10);
    }
    return iso.slice(0, 10); // day
  }
}
