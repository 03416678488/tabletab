import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';

import { Order } from '@modules/order/entities/order.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { Income } from '@modules/income/entities/income.entity';
import { Expense } from '@modules/expense/entities/expense.entity';

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
    incomeTotal: number;
    expenseTotal: number;
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
    @InjectRepository(Income)
    private readonly _incomeRepo: Repository<Income>,
    @InjectRepository(Expense)
    private readonly _expenseRepo: Repository<Expense>,
  ) {}

  async getSalesReport(fromStr?: string, toStr?: string): Promise<SalesReport> {
    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 864e5);
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

    // Payment-method breakdown from sale transactions in range.
    const sales = await this._txnRepo.find({
      where: { type: 'sale', createdAt: Between(from, to) },
    });
    const byMethod = new Map<string, { count: number; total: number }>();
    for (const s of sales) {
      const m = byMethod.get(s.method) ?? { count: 0, total: 0 };
      m.count += 1;
      m.total += s.amount;
      byMethod.set(s.method, m);
    }

    // Income / expense recorded in range (all payment types, not just cash).
    const [incomes, expenses] = await Promise.all([
      this._incomeRepo.find({ where: { createdAt: Between(from, to) } }),
      this._expenseRepo.find({ where: { createdAt: Between(from, to) } }),
    ]);
    const incomeTotal = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = salesTotal + incomeTotal - expenseTotal;

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
        incomeTotal: round2(incomeTotal),
        expenseTotal: round2(expenseTotal),
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
