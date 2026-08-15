"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  PartyPopper,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { useSalesReport } from "@/features/report/hooks/use-sales-report";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";

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

export function ReportDashboard() {
  const [fromDay, setFromDay] = useState(isoDay(-29));
  const [toDay, setToDay] = useState(isoDay(0));

  const from = `${fromDay}T00:00:00`;
  const to = `${toDay}T23:59:59`;
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const { report, loading, error } = useSalesReport(from, to, branchId);

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
            Sales performance over a date range.
          </p>
        </div>
        <div className="flex items-end gap-2">
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
          {/* KPI cards */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={TrendingUp}
              label="Sales"
              value={formatMoney(report.totals.salesTotal)}
              tone="brand"
            />
            <Kpi icon={ShoppingBag} label="Orders" value={String(report.totals.ordersCount)} />
            <Kpi icon={Receipt} label="Avg. Order" value={formatMoney(report.totals.avgOrder)} />
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
            />
          </div>

          {/* Sales by day */}
          <Card className="mt-5 p-5">
            <h2 className="text-sm font-semibold text-ink">Sales by day</h2>
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

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  tone?: "brand" | "up" | "down";
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
      <p className="mt-1.5 font-display text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function Breakdown({
  title,
  rows,
  empty = "No data.",
}: {
  title: string;
  rows: { label: string; sub: string; value: string }[];
  empty?: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
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
