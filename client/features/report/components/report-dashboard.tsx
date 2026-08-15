"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarCheck,
  Clock,
  Download,
  MapPin,
  PartyPopper,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { useSalesReport } from "@/features/report/hooks/use-sales-report";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { exportReportCsv } from "@/features/report/lib/export-report-csv";
import type { ReportGranularity, SalesReport } from "@/features/report/types/report.types";

function isoDay(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const TYPE_LABEL: Record<string, string> = { pos: "POS", online: "Online", table: "Table" };
const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mfs: "MFS",
  other: "Other",
};
const GRANS: { key: ReportGranularity; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export function ReportDashboard() {
  const [fromDay, setFromDay] = useState(isoDay(-29));
  const [toDay, setToDay] = useState(isoDay(0));
  const [granularity, setGranularity] = useState<ReportGranularity>("day");

  const from = `${fromDay}T00:00:00`;
  const to = `${toDay}T23:59:59`;
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const { report, loading, error } = useSalesReport(from, to, branchId, granularity);

  const maxDay = useMemo(
    () => Math.max(1, ...(report?.byDay.map((d) => d.total) ?? [1])),
    [report],
  );

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <BarChart3 className="size-5 text-brand" /> Reports
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sales performance, compared to the previous period.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={fromDay}
              onChange={(e) => setFromDay(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={toDay}
              onChange={(e) => setToDay(e.target.value)}
              className="h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={!report}
            onClick={() => report && exportReportCsv(report)}
          >
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : error || !report ? (
        <Card className="mt-5 p-0">
          <EmptyState
            className="py-12"
            icon={BarChart3}
            title="Couldn't load report"
            description={error ?? ""}
          />
        </Card>
      ) : (
        <>
          {/* KPI cards with period-over-period deltas */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={TrendingUp}
              label="Sales"
              value={formatMoney(report.totals.salesTotal)}
              tone="brand"
              delta={<Delta cur={report.totals.salesTotal} prev={report.previous.salesTotal} />}
            />
            <Kpi
              icon={ShoppingBag}
              label="Orders"
              value={String(report.totals.ordersCount)}
              delta={<Delta cur={report.totals.ordersCount} prev={report.previous.ordersCount} />}
            />
            <Kpi
              icon={Receipt}
              label="Avg. Order"
              value={formatMoney(report.totals.avgOrder)}
              delta={<Delta cur={report.totals.avgOrder} prev={report.previous.avgOrder} />}
            />
            <Kpi
              icon={Receipt}
              label="Discount / Tax"
              value={`${formatMoney(report.totals.discountTotal)} / ${formatMoney(report.totals.taxTotal)}`}
            />
          </div>

          {/* Reservation deposits / event payments / total earnings */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              icon={CalendarCheck}
              label="Reservation deposits"
              value={formatMoney(report.totals.reservationTotal)}
              sub={`${report.totals.reservationCount} booking${
                report.totals.reservationCount === 1 ? "" : "s"
              }`}
              tone="up"
            />
            <Kpi
              icon={PartyPopper}
              label="Event payments"
              value={formatMoney(report.totals.eventTotal)}
              sub={`${report.totals.eventCount} event${report.totals.eventCount === 1 ? "" : "s"}`}
              tone="up"
            />
            <Kpi
              icon={Wallet}
              label="Total earnings"
              value={formatMoney(report.totals.netProfit)}
              tone={report.totals.netProfit < 0 ? "down" : "up"}
              delta={<Delta cur={report.totals.netProfit} prev={report.previous.netProfit} />}
            />
          </div>

          {/* Revenue over time — granularity toggle */}
          <Card className="mt-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Revenue over time</h2>
              <div className="flex rounded-lg border border-border p-0.5">
                {GRANS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGranularity(g.key)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      granularity === g.key
                        ? "bg-brand text-primary-foreground"
                        : "text-muted-foreground hover:text-ink",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            {report.byDay.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No sales in this range.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {report.byDay.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{d.day}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${(d.total / maxDay) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-sm font-medium text-ink">
                      {formatMoney(d.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Peak hours + by branch */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <PeakHours report={report} />
            <Breakdown
              title="By branch"
              icon={MapPin}
              rows={report.byBranch.map((b) => ({
                label: b.branchName,
                sub: `${b.count} order${b.count === 1 ? "" : "s"}`,
                value: formatMoney(b.total),
              }))}
              empty="No branch sales in range."
            />
          </div>

          {/* Breakdowns */}
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <Breakdown
              title="By order type"
              rows={report.byType.map((t) => ({
                label: TYPE_LABEL[t.type] ?? t.type,
                sub: `${t.count} order${t.count === 1 ? "" : "s"}`,
                value: formatMoney(t.total),
              }))}
            />
            <Breakdown
              title="By payment method"
              rows={report.byMethod.map((m) => ({
                label: METHOD_LABEL[m.method] ?? m.method,
                sub: `${m.count} txn${m.count === 1 ? "" : "s"}`,
                value: formatMoney(m.total),
              }))}
              empty="No payments recorded."
            />
            <Breakdown
              title="Top items"
              rows={report.topItems.map((it) => ({
                label: it.name,
                sub: `${it.qty} sold`,
                value: formatMoney(it.revenue),
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** ▲/▼ percentage change vs the previous period. */
function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev <= 0) {
    return cur > 0 ? <span className="text-xs font-medium text-emerald-600">new</span> : null;
  }
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span
      title="vs previous period"
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-emerald-600" : "text-rose-600",
      )}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

/** Revenue by hour-of-day — a compact 24-bar peak-hours chart. */
function PeakHours({ report }: { report: SalesReport }) {
  const max = Math.max(1, ...report.byHour.map((h) => h.total));
  const busiest = report.byHour.reduce((a, b) => (b.total > a.total ? b : a), report.byHour[0]);
  const hasData = report.byHour.some((h) => h.total > 0);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Clock className="size-4 text-muted-foreground" /> Peak hours
        </h2>
        {hasData && (
          <span className="text-xs text-muted-foreground">
            Busiest {String(busiest.hour).padStart(2, "0")}:00
          </span>
        )}
      </div>
      {!hasData ? (
        <p className="mt-3 text-sm text-muted-foreground">No sales in this range.</p>
      ) : (
        <div className="mt-4 flex h-32 items-end gap-0.5">
          {report.byHour.map((h) => (
            <div key={h.hour} className="group relative flex flex-1 flex-col items-center">
              <div
                className={cn(
                  "w-full rounded-t-sm transition-colors",
                  h.hour === busiest.hour ? "bg-brand" : "bg-brand/30 group-hover:bg-brand/60",
                )}
                style={{ height: `${Math.max(2, (h.total / max) * 100)}%` }}
                title={`${String(h.hour).padStart(2, "0")}:00 — ${formatMoney(h.total)} (${h.count})`}
              />
            </div>
          ))}
        </div>
      )}
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </Card>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  delta,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  tone?: "brand" | "up" | "down";
  delta?: React.ReactNode;
}) {
  const iconTone =
    tone === "brand"
      ? "text-brand"
      : tone === "up"
        ? "text-emerald-600"
        : tone === "down"
          ? "text-rose-600"
          : "text-muted-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={cn("size-4", iconTone)} />
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <p className="font-display text-2xl font-bold text-ink">{value}</p>
        {delta}
      </div>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function Breakdown({
  title,
  rows,
  empty = "No data.",
  icon: Icon,
}: {
  title: string;
  rows: { label: string; sub: string; value: string }[];
  empty?: string;
  icon?: typeof TrendingUp;
}) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r, i) => (
            <li key={`${r.label}-${i}`} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.sub}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
