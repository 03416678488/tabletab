import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { TenantRequest } from '@modules/tenancy/tenancy.types';

export type Period = 'day' | 'month' | 'year';

/** Hour buckets shown on the peak-hours heatmap (must match the client). */
const HEATMAP_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Per-period bucketing. Tokens are fixed constants (never user input) so they are
// safe to inline into the interval/date_trunc SQL.
const CFG: Record<Period, { trunc: string; step: string; back: number; fmt: string }> = {
  day: { trunc: 'day', step: 'day', back: 6, fmt: 'Dy' },
  month: { trunc: 'month', step: 'month', back: 11, fmt: 'Mon' },
  year: { trunc: 'year', step: 'year', back: 2, fmt: 'YYYY' },
};

const num = (v: unknown) => (v == null ? 0 : Number(v));
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
const trend = (curr: number, prev: number) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Aggregates the restaurant's real order/transaction data into the shape the
 * owner dashboard renders. Request-scoped so it runs against the caller's tenant
 * database (falling back to the default connection in single-tenant/dev).
 */
@Injectable({ scope: Scope.REQUEST })
export class DashboardAnalyticsService {
  constructor(
    @Inject(REQUEST) private readonly _req: TenantRequest,
    @InjectDataSource() private readonly _defaultDs: DataSource,
  ) {}

  private get ds(): DataSource {
    return this._req.tenantDataSource ?? this._defaultDs;
  }

  /** Start of the series window for a period, as an SQL expression. */
  private windowStart(period: Period): string {
    const { trunc, step, back } = CFG[period];
    return `date_trunc('${trunc}', now()) - interval '${back} ${step}'`;
  }

  async getOwnerAnalytics(period: Period) {
    const [
      revenueSeries,
      kpis,
      spark,
      bestSellers,
      channelSplit,
      branchSplit,
      categorySplit,
      paymentSplit,
      fulfillment,
      customers,
      heatmap,
      target,
    ] = await Promise.all([
      this.revenueSeries(period),
      this.kpis(),
      this.sparklines(),
      this.bestSellers(period),
      this.channelSplit(period),
      this.branchSplit(period),
      this.categorySplit(period),
      this.paymentSplit(period),
      this.fulfillment(period),
      this.customers(period),
      this.hourlyHeatmap(),
      this.target(period),
    ]);

    return {
      kpis: { ...kpis, ...spark },
      revenueSeries,
      bestSellers,
      channelSplit,
      branchSplit,
      // No staff↔order linkage in the schema yet, so this stays empty (the card
      // hides itself when there are no rows).
      staffPerformance: [],
      hourlyHeatmap: heatmap,
      categorySplit,
      paymentSplit,
      fulfillment,
      customers,
      target,
    };
  }

  // ── Revenue / orders time series ──────────────────────────────────────────
  private async revenueSeries(period: Period) {
    const { trunc, step, back, fmt } = CFG[period];
    const rows = await this.ds.query(`
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('${trunc}', now()) - interval '${back} ${step}',
          date_trunc('${trunc}', now()),
          interval '1 ${step}'
        ) AS b
      )
      SELECT trim(to_char(bk.b, '${fmt}')) AS label,
             COALESCE(SUM(o.total), 0) AS revenue,
             COALESCE(COUNT(o.id), 0) AS orders
      FROM buckets bk
      LEFT JOIN orders o
        ON date_trunc('${trunc}', o."createdAt") = bk.b AND o.status <> 'cancelled'
      GROUP BY bk.b ORDER BY bk.b
    `);
    return rows.map((r: any) => ({
      label: r.label,
      revenue: num(r.revenue),
      orders: num(r.orders),
    }));
  }

  // ── KPIs (today vs yesterday) ─────────────────────────────────────────────
  private async kpis() {
    const [r] = await this.ds.query(`
      SELECT
        COALESCE(SUM(total) FILTER (WHERE d = 0), 0)  AS rev_today,
        COALESCE(COUNT(*)   FILTER (WHERE d = 0), 0)  AS ord_today,
        COALESCE(SUM(total) FILTER (WHERE d = 1), 0)  AS rev_prev,
        COALESCE(COUNT(*)   FILTER (WHERE d = 1), 0)  AS ord_prev
      FROM (
        SELECT total,
               (date_trunc('day', now())::date - date_trunc('day', "createdAt")::date) AS d
        FROM orders
        WHERE status <> 'cancelled' AND "createdAt" >= date_trunc('day', now()) - interval '1 day'
      ) t
    `);
    const [k] = await this.ds.query(`
      SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 60)
                 FILTER (WHERE d = 0), 0) AS kitchen_today,
        COALESCE(AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 60)
                 FILTER (WHERE d = 1), 0) AS kitchen_prev
      FROM (
        SELECT "updatedAt", "createdAt",
               (date_trunc('day', now())::date - date_trunc('day', "createdAt")::date) AS d
        FROM orders
        WHERE status IN ('served', 'completed')
          AND "createdAt" >= date_trunc('day', now()) - interval '1 day'
      ) t
    `);

    const revToday = num(r.rev_today);
    const ordToday = num(r.ord_today);
    const revPrev = num(r.rev_prev);
    const ordPrev = num(r.ord_prev);
    const aovToday = ordToday > 0 ? revToday / ordToday : 0;
    const aovPrev = ordPrev > 0 ? revPrev / ordPrev : 0;

    return {
      revenueToday: round2(revToday),
      ordersToday: ordToday,
      avgOrderValue: round2(aovToday),
      avgKitchenResponseMins: round2(num(k.kitchen_today)),
      revenueTrendPct: trend(revToday, revPrev),
      ordersTrendPct: trend(ordToday, ordPrev),
      avgOrderTrendPct: trend(aovToday, aovPrev),
      kitchenTrendPct: trend(num(k.kitchen_today), num(k.kitchen_prev)),
    };
  }

  // ── KPI sparklines: last 7 days ───────────────────────────────────────────
  private async sparklines() {
    const rows = await this.ds.query(`
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('day', now()) - interval '6 days',
          date_trunc('day', now()),
          interval '1 day'
        ) AS b
      )
      SELECT
        COALESCE(SUM(o.total), 0) AS revenue,
        COALESCE(COUNT(o.id), 0) AS orders,
        COALESCE(AVG(EXTRACT(EPOCH FROM (o."updatedAt" - o."createdAt")) / 60)
                 FILTER (WHERE o.status IN ('served', 'completed')), 0) AS kitchen
      FROM buckets bk
      LEFT JOIN orders o
        ON date_trunc('day', o."createdAt") = bk.b AND o.status <> 'cancelled'
      GROUP BY bk.b ORDER BY bk.b
    `);
    const revenueSpark = rows.map((r: any) => num(r.revenue));
    const ordersSpark = rows.map((r: any) => num(r.orders));
    const aovSpark = rows.map((r: any) => round2(num(r.orders) > 0 ? num(r.revenue) / num(r.orders) : 0));
    const kitchenSpark = rows.map((r: any) => round2(num(r.kitchen)));
    return { revenueSpark, ordersSpark, aovSpark, kitchenSpark };
  }

  // ── Best-selling items ────────────────────────────────────────────────────
  private async bestSellers(period: Period) {
    const rows = await this.ds.query(`
      SELECT oi."menuItemId" AS "menuItemId", oi.name AS name,
             SUM(oi.quantity) AS quantity, SUM(oi."lineTotal") AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      WHERE o.status <> 'cancelled' AND o."createdAt" >= ${this.windowStart(period)}
      GROUP BY oi."menuItemId", oi.name
      ORDER BY quantity DESC LIMIT 5
    `);
    return rows.map((r: any) => ({
      menuItemId: r.menuItemId ?? r.name,
      name: r.name,
      quantity: num(r.quantity),
      revenue: round2(num(r.revenue)),
    }));
  }

  // ── Channel split (in-venue vs online) ────────────────────────────────────
  private async channelSplit(period: Period) {
    const rows = await this.ds.query(`
      SELECT CASE WHEN "orderType" = 'online' THEN 'online' ELSE 'in-venue' END AS channel,
             SUM(total) AS revenue, COUNT(*) AS orders
      FROM orders
      WHERE status <> 'cancelled' AND "createdAt" >= ${this.windowStart(period)}
      GROUP BY channel
    `);
    const total = rows.reduce((s: number, r: any) => s + num(r.revenue), 0);
    const labels: Record<string, string> = { 'in-venue': 'Dine-in', online: 'Online' };
    return rows.map((r: any) => ({
      channel: r.channel,
      label: labels[r.channel] ?? r.channel,
      revenue: round2(num(r.revenue)),
      orders: num(r.orders),
      pct: pct(num(r.revenue), total),
    }));
  }

  // ── Branch split ──────────────────────────────────────────────────────────
  private async branchSplit(period: Period) {
    const rows = await this.ds.query(`
      SELECT o."branchId" AS "branchId", COALESCE(b.name, 'Unassigned') AS name,
             SUM(o.total) AS revenue, COUNT(*) AS orders
      FROM orders o
      LEFT JOIN branches b ON b.id = o."branchId"
      WHERE o.status <> 'cancelled' AND o."createdAt" >= ${this.windowStart(period)}
      GROUP BY o."branchId", b.name
      ORDER BY revenue DESC
    `);
    const total = rows.reduce((s: number, r: any) => s + num(r.revenue), 0);
    return rows.map((r: any) => ({
      branchId: r.branchId ?? 'unassigned',
      name: r.name,
      revenue: round2(num(r.revenue)),
      orders: num(r.orders),
      pct: pct(num(r.revenue), total),
    }));
  }

  // ── Sales by menu category ────────────────────────────────────────────────
  private async categorySplit(period: Period) {
    const rows = await this.ds.query(`
      SELECT COALESCE(c.name, 'Uncategorized') AS category,
             SUM(oi."lineTotal") AS revenue, SUM(oi.quantity) AS orders
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      LEFT JOIN menu_items mi ON mi.id = oi."menuItemId"
      LEFT JOIN categories c ON c.id = mi."categoryId"
      WHERE o.status <> 'cancelled' AND o."createdAt" >= ${this.windowStart(period)}
      GROUP BY c.name
      ORDER BY revenue DESC LIMIT 6
    `);
    const total = rows.reduce((s: number, r: any) => s + num(r.revenue), 0);
    return rows.map((r: any) => ({
      category: r.category,
      revenue: round2(num(r.revenue)),
      orders: num(r.orders),
      pct: pct(num(r.revenue), total),
    }));
  }

  // ── Payment method split (from transactions) ──────────────────────────────
  private async paymentSplit(period: Period) {
    const rows = await this.ds.query(`
      SELECT method, SUM(amount) AS amount
      FROM transactions
      WHERE type = 'sale' AND "createdAt" >= ${this.windowStart(period)}
      GROUP BY method ORDER BY amount DESC
    `);
    const total = rows.reduce((s: number, r: any) => s + num(r.amount), 0);
    const labels: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      mfs: 'Mobile / wallet',
      other: 'Other',
    };
    return rows.map((r: any) => ({
      method: r.method,
      label: labels[r.method] ?? r.method,
      amount: round2(num(r.amount)),
      pct: pct(num(r.amount), total),
    }));
  }

  // ── Fulfillment mix (by order type) ───────────────────────────────────────
  private async fulfillment(period: Period) {
    const rows = await this.ds.query(`
      SELECT "orderType" AS type, COUNT(*) AS orders
      FROM orders
      WHERE status <> 'cancelled' AND "createdAt" >= ${this.windowStart(period)}
      GROUP BY "orderType" ORDER BY orders DESC
    `);
    const total = rows.reduce((s: number, r: any) => s + num(r.orders), 0);
    const labels: Record<string, string> = {
      table: 'Dine-in (table)',
      pos: 'Counter / POS',
      online: 'Online',
    };
    return rows.map((r: any) => ({
      type: r.type,
      label: labels[r.type] ?? r.type,
      orders: num(r.orders),
      pct: pct(num(r.orders), total),
    }));
  }

  // ── Customer insights (new vs returning within the window) ────────────────
  private async customers(period: Period) {
    const start = this.windowStart(period);
    const [r] = await this.ds.query(`
      WITH firsts AS (
        SELECT "customerId", MIN("createdAt") AS first_at
        FROM orders WHERE "customerId" IS NOT NULL GROUP BY "customerId"
      ),
      active AS (
        SELECT DISTINCT "customerId" FROM orders
        WHERE "customerId" IS NOT NULL AND "createdAt" >= ${start}
      )
      SELECT
        COUNT(*) FILTER (WHERE fr.first_at >= ${start}) AS new_count,
        COUNT(*) FILTER (WHERE fr.first_at <  ${start}) AS returning_count
      FROM active a JOIN firsts fr ON fr."customerId" = a."customerId"
    `);
    const newCount = num(r.new_count);
    const returningCount = num(r.returning_count);
    const totalActive = newCount + returningCount;
    return {
      newCount,
      returningCount,
      returningPct: pct(returningCount, totalActive),
      avgVisitsPerMonth: 0,
      repeatRatePct: pct(returningCount, totalActive),
    };
  }

  // ── Peak-hours heatmap (day-of-week × hour) ───────────────────────────────
  private async hourlyHeatmap() {
    const rows = await this.ds.query(`
      SELECT EXTRACT(DOW FROM "createdAt")::int AS dow,
             EXTRACT(HOUR FROM "createdAt")::int AS hr,
             COUNT(*) AS c
      FROM orders
      WHERE status <> 'cancelled'
        AND "createdAt" >= now() - interval '90 days'
      GROUP BY dow, hr
    `);
    // counts[dowName][hour] = orders
    const counts: Record<string, Record<number, number>> = {};
    for (const r of rows) {
      const day = DOW[num(r.dow)];
      (counts[day] ??= {})[num(r.hr)] = num(r.c);
    }
    return WEEK_ORDER.map((day) => ({
      day,
      hours: HEATMAP_HOURS.map((h) => counts[day]?.[h] ?? 0),
    }));
  }

  // ── Revenue target (achieved vs a growth goal over the previous period) ────
  private async target(period: Period) {
    const { trunc, step } = CFG[period];
    const [r] = await this.ds.query(`
      SELECT
        COALESCE(SUM(total) FILTER (
          WHERE "createdAt" >= date_trunc('${trunc}', now())), 0) AS achieved,
        COALESCE(SUM(total) FILTER (
          WHERE "createdAt" >= date_trunc('${trunc}', now()) - interval '1 ${step}'
            AND "createdAt" <  date_trunc('${trunc}', now())), 0) AS prev
      FROM orders WHERE status <> 'cancelled'
    `);
    const achieved = round2(num(r.achieved));
    const prev = num(r.prev);
    // Goal: beat the previous period by 15% (floor so an empty prev still shows a bar).
    const target = round2(Math.max(prev * 1.15, achieved, 100));
    return { target, achieved };
  }
}
