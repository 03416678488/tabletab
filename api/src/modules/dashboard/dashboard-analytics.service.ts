import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
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
const CFG: Record<
  Period,
  { trunc: string; step: string; back: number; fmt: string }
> = {
  day: { trunc: 'day', step: 'day', back: 6, fmt: 'Dy' },
  month: { trunc: 'month', step: 'month', back: 11, fmt: 'Mon' },
  year: { trunc: 'year', step: 'year', back: 2, fmt: 'YYYY' },
};

/** A resolved aggregation window (preset or custom range). All fields are SQL
 *  fragments built from validated constants only. */
interface Win {
  trunc: string;
  step: string;
  fmt: string;
  startExpr: string;
  endExpr: string;
}

const num = (v: unknown) => (v == null ? 0 : Number(v));
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;
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

  /** Active branch scope for this request ("all branches" when undefined). */
  private _branchId?: string;

  private static readonly UUID =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  /** Strict YYYY-MM-DD — safe to inline as a SQL date literal. */
  private static readonly DATE = /^\d{4}-\d{2}-\d{2}$/;

  /** Validate the incoming branch filter — a strict UUID, or none for all branches. */
  private normalizeBranchId(branchId?: string): string | undefined {
    if (!branchId || branchId === 'all') return undefined;
    if (!DashboardAnalyticsService.UUID.test(branchId)) {
      throw new BadRequestException('Invalid branchId');
    }
    return branchId;
  }

  /**
   * SQL fragment scoping a query to the active branch (empty = all branches).
   * `col` is the fully-qualified branch column, e.g. `o."branchId"`. Safe to
   * inline: `_branchId` is only ever a validated UUID.
   */
  private branchAnd(col: string): string {
    return this._branchId ? ` AND ${col} = '${this._branchId}'` : '';
  }

  /**
   * The aggregation window, resolved from either a preset period or a custom
   * `from`/`to` range. For custom ranges the bucket granularity is chosen from
   * the span so the series stays readable and bounded (day ≤ 2mo, month ≤ 2yr,
   * else year). `startExpr`/`endExpr` are SQL timestamp expressions built only
   * from validated constants — safe to inline.
   */
  private resolveWindow(period: Period, from?: string, to?: string): Win {
    const D = DashboardAnalyticsService.DATE;
    if (from && to && D.test(from) && D.test(to)) {
      const spanDays = (Date.parse(to) - Date.parse(from)) / 86_400_000;
      const g =
        spanDays <= 62
          ? { trunc: 'day', fmt: 'Mon DD' }
          : spanDays <= 731
            ? { trunc: 'month', fmt: 'Mon YY' }
            : { trunc: 'year', fmt: 'YYYY' };
      return {
        trunc: g.trunc,
        step: g.trunc,
        fmt: g.fmt,
        startExpr: `date_trunc('${g.trunc}', DATE '${from}')`,
        endExpr: `date_trunc('${g.trunc}', DATE '${to}')`,
      };
    }
    const { trunc, step, back, fmt } = CFG[period];
    return {
      trunc,
      step,
      fmt,
      startExpr: `date_trunc('${trunc}', now()) - interval '${back} ${step}'`,
      endExpr: `date_trunc('${trunc}', now())`,
    };
  }

  /** `AND col >= start AND col < end+1step` — the window as a SQL filter. */
  private rangeFilter(col: string, win: Win): string {
    return ` AND ${col} >= ${win.startExpr} AND ${col} < ${win.endExpr} + interval '1 ${win.step}'`;
  }

  async getOwnerAnalytics(
    period: Period,
    branchId?: string,
    from?: string,
    to?: string,
  ) {
    this._branchId = this.normalizeBranchId(branchId);
    const win = this.resolveWindow(period, from, to);

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
      ancillaryEarnings,
    ] = await Promise.all([
      this.revenueSeries(win),
      this.kpis(),
      this.sparklines(),
      this.bestSellers(win),
      this.channelSplit(win),
      this.branchSplit(win),
      this.categorySplit(win),
      this.paymentSplit(win),
      this.fulfillment(win),
      this.customers(win),
      this.hourlyHeatmap(),
      this.target(win),
      this.ancillaryEarnings(win),
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
      ancillaryEarnings,
    };
  }

  // ── Ancillary earnings (reservation deposits + event payments) ────────────
  // These are ledger transactions with no order link, so they never appear in
  // the order-based revenue series — surfaced separately on the dashboard.
  private async ancillaryEarnings(win: Win) {
    const rows = await this.ds.query(`
      SELECT t.type, COALESCE(SUM(t.amount), 0) AS amount, COUNT(*) AS count
      FROM transactions t
      WHERE t.type IN ('reservation_deposit', 'event_payment')${this.rangeFilter('t."createdAt"', win)}${this.branchAnd('t."branchId"')}
      GROUP BY t.type
    `);
    const by = (type: string) => rows.find((r: any) => r.type === type);
    const reservationDeposits = num(by('reservation_deposit')?.amount);
    const eventPayments = num(by('event_payment')?.amount);
    return {
      reservationDeposits: round2(reservationDeposits),
      reservationCount: num(by('reservation_deposit')?.count),
      eventPayments: round2(eventPayments),
      eventCount: num(by('event_payment')?.count),
      total: round2(reservationDeposits + eventPayments),
    };
  }

  // ── Revenue / orders time series ──────────────────────────────────────────
  private async revenueSeries(win: Win) {
    const rows = await this.ds.query(`
      WITH buckets AS (
        SELECT generate_series(
          ${win.startExpr},
          ${win.endExpr},
          interval '1 ${win.step}'
        ) AS b
      )
      SELECT trim(to_char(bk.b, '${win.fmt}')) AS label,
             COALESCE(SUM(o.total), 0) AS revenue,
             COALESCE(COUNT(o.id), 0) AS orders
      FROM buckets bk
      LEFT JOIN orders o
        ON date_trunc('${win.trunc}', o."createdAt") = bk.b AND o.status <> 'cancelled'${this.branchAnd('o."branchId"')}
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
        FROM orders o
        WHERE status <> 'cancelled' AND "createdAt" >= date_trunc('day', now()) - interval '1 day'${this.branchAnd('o."branchId"')}
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
        FROM orders o
        WHERE status IN ('served', 'completed')
          AND "createdAt" >= date_trunc('day', now()) - interval '1 day'${this.branchAnd('o."branchId"')}
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
        ON date_trunc('day', o."createdAt") = bk.b AND o.status <> 'cancelled'${this.branchAnd('o."branchId"')}
      GROUP BY bk.b ORDER BY bk.b
    `);
    const revenueSpark = rows.map((r: any) => num(r.revenue));
    const ordersSpark = rows.map((r: any) => num(r.orders));
    const aovSpark = rows.map((r: any) =>
      round2(num(r.orders) > 0 ? num(r.revenue) / num(r.orders) : 0),
    );
    const kitchenSpark = rows.map((r: any) => round2(num(r.kitchen)));
    return { revenueSpark, ordersSpark, aovSpark, kitchenSpark };
  }

  // ── Best-selling items ────────────────────────────────────────────────────
  private async bestSellers(win: Win) {
    const rows = await this.ds.query(`
      SELECT oi."menuItemId" AS "menuItemId", oi.name AS name,
             SUM(oi.quantity) AS quantity, SUM(oi."lineTotal") AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      WHERE o.status <> 'cancelled'${this.rangeFilter('o."createdAt"', win)}${this.branchAnd('o."branchId"')}
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
  private async channelSplit(win: Win) {
    const rows = await this.ds.query(`
      SELECT CASE WHEN "orderType" = 'online' THEN 'online' ELSE 'in-venue' END AS channel,
             SUM(total) AS revenue, COUNT(*) AS orders
      FROM orders
      WHERE status <> 'cancelled'${this.rangeFilter('"createdAt"', win)}${this.branchAnd('"branchId"')}
      GROUP BY channel
    `);
    const total = rows.reduce((s: number, r: any) => s + num(r.revenue), 0);
    const labels: Record<string, string> = {
      'in-venue': 'Dine-in',
      online: 'Online',
    };
    return rows.map((r: any) => ({
      channel: r.channel,
      label: labels[r.channel] ?? r.channel,
      revenue: round2(num(r.revenue)),
      orders: num(r.orders),
      pct: pct(num(r.revenue), total),
    }));
  }

  // ── Branch split ──────────────────────────────────────────────────────────
  private async branchSplit(win: Win) {
    const rows = await this.ds.query(`
      SELECT o."branchId" AS "branchId", COALESCE(b.name, 'Unassigned') AS name,
             SUM(o.total) AS revenue, COUNT(*) AS orders
      FROM orders o
      LEFT JOIN branches b ON b.id = o."branchId"
      WHERE o.status <> 'cancelled'${this.rangeFilter('o."createdAt"', win)}
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
  private async categorySplit(win: Win) {
    const rows = await this.ds.query(`
      SELECT COALESCE(c.name, 'Uncategorized') AS category,
             SUM(oi."lineTotal") AS revenue, SUM(oi.quantity) AS orders
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      LEFT JOIN menu_items mi ON mi.id = oi."menuItemId"
      LEFT JOIN menu_item_categories mic ON mic."menuItemId" = mi.id
      LEFT JOIN categories c ON c.id = mic."categoryId" AND c."branchId" = o."branchId"
      WHERE o.status <> 'cancelled'${this.rangeFilter('o."createdAt"', win)}${this.branchAnd('o."branchId"')}
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
  private async paymentSplit(win: Win) {
    const rows = await this.ds.query(`
      SELECT t.method, SUM(t.amount) AS amount
      FROM transactions t
      LEFT JOIN orders o ON o.id = t."orderId"
      WHERE t.type = 'sale'${this.rangeFilter('t."createdAt"', win)}${this.branchAnd('o."branchId"')}
      GROUP BY t.method ORDER BY amount DESC
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
  private async fulfillment(win: Win) {
    const rows = await this.ds.query(`
      SELECT "orderType" AS type, COUNT(*) AS orders
      FROM orders
      WHERE status <> 'cancelled'${this.rangeFilter('"createdAt"', win)}${this.branchAnd('"branchId"')}
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
  private async customers(win: Win) {
    const start = win.startExpr;
    const [r] = await this.ds.query(`
      WITH firsts AS (
        SELECT "customerId", MIN("createdAt") AS first_at
        FROM orders WHERE "customerId" IS NOT NULL${this.branchAnd('"branchId"')} GROUP BY "customerId"
      ),
      active AS (
        SELECT DISTINCT "customerId" FROM orders
        WHERE "customerId" IS NOT NULL${this.rangeFilter('"createdAt"', win)}${this.branchAnd('"branchId"')}
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
        AND "createdAt" >= now() - interval '90 days'${this.branchAnd('"branchId"')}
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
  private async target(win: Win) {
    // Achieved = revenue in the window; prev = the equally-long window before it.
    const end = `${win.endExpr} + interval '1 ${win.step}'`;
    const [r] = await this.ds.query(`
      SELECT
        COALESCE(SUM(total) FILTER (
          WHERE "createdAt" >= ${win.startExpr} AND "createdAt" < ${end}), 0) AS achieved,
        COALESCE(SUM(total) FILTER (
          WHERE "createdAt" >= ${win.startExpr} - (${end} - ${win.startExpr})
            AND "createdAt" <  ${win.startExpr}), 0) AS prev
      FROM orders WHERE status <> 'cancelled'${this.branchAnd('"branchId"')}
    `);
    const achieved = round2(num(r.achieved));
    const prev = num(r.prev);
    // Goal: beat the previous period by 15% (floor so an empty prev still shows a bar).
    const target = round2(Math.max(prev * 1.15, achieved, 100));
    return { target, achieved };
  }
}
