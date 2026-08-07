"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Clock,
  CreditCard,
  DollarSign,
  Flame,
  Repeat,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { KpiCard } from "@/features/admin/components/kpi-card";
import { RevenueOrdersChart } from "@/features/admin/components/revenue-orders-chart";
import { PeakHoursHeatmap } from "@/features/admin/components/peak-hours-heatmap";
import { CategoryDonut } from "@/features/admin/components/category-donut";
import { TargetGauge } from "@/features/admin/components/target-gauge";
import { ShareBars } from "@/features/admin/components/share-bars";
import { SplitBars } from "@/features/admin/components/split-bars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReservationStatusPill, StatusPill } from "@/components/ui/status-pill";
import { ROLE_LABELS } from "@/lib/nav";
import { api } from "@/lib/api";
import { analyticsService } from "@/features/admin/services/analytics.service";
import { formatSlotLabel } from "@/lib/reservation-utils";
import type { AnalyticsPeriod, OwnerAnalytics, Reservation, ReservationTask } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useActiveBranch, isAllBranches } from "@/features/branch/hooks/use-active-branch";

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

export function AdminDashboard() {
  const { get } = useSettings();
  const brandName = get("company", "name") || "Your restaurant";
  // Scope KPIs to the topbar branch selection ("All branches" → undefined = all).
  const activeBranchId = useActiveBranch((s) => s.activeBranchId);
  const branchId = activeBranchId && !isAllBranches(activeBranchId) ? activeBranchId : undefined;
  const [period, setPeriod] = useState<AnalyticsPeriod>("day");
  const [data, setData] = useState<OwnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [resStats, setResStats] = useState<{ covers: number; noShows: number; count: number } | null>(
    null,
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tasks, setTasks] = useState<ReservationTask[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    analyticsService
      .getOwnerAnalytics(period, branchId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, branchId]);

  useEffect(() => {
    Promise.all([
      api.getReservationStats(),
      api.getReservations(),
      api.getReservationTasks(),
    ]).then(([stats, res, t]) => {
      setResStats(stats);
      const today = new Date().toISOString().slice(0, 10);
      setReservations(
        res.filter((r) => r.date >= today && !["cancelled", "completed"].includes(r.status)),
      );
      setTasks(t.filter((x) => x.status === "active" || x.status === "pending"));
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand-deep via-brand to-brand-hover px-6 py-8 text-white shadow-[var(--shadow-elevated)] sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 size-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <StatusPill tone="neutral" className="mb-3 border-white/20 bg-white/10 text-white">
              <Sparkles className="size-3" />
              {brandName} analytics
            </StatusPill>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Performance at a glance
            </h1>
            <p className="mt-2 max-w-lg text-sm text-teal-100/90">
              Revenue, operations, and customer metrics — aggregated live from your orders.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 p-1 backdrop-blur-sm">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  period === p.id
                    ? "bg-white text-brand-deep shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's revenue"
          value={formatCurrency(kpis.revenueToday)}
          trend={kpis.revenueTrendPct}
          spark={kpis.revenueSpark}
          icon={DollarSign}
          accent="brand"
        />
        <KpiCard
          label="Orders today"
          value={String(kpis.ordersToday)}
          trend={kpis.ordersTrendPct}
          spark={kpis.ordersSpark}
          icon={ShoppingBag}
          accent="accent"
        />
        <KpiCard
          label="Avg order value"
          value={formatCurrency(kpis.avgOrderValue)}
          trend={kpis.avgOrderTrendPct}
          spark={kpis.aovSpark}
          icon={TrendingUp}
          accent="neutral"
        />
        <KpiCard
          label="Avg kitchen response"
          value={`${kpis.avgKitchenResponseMins} min`}
          trend={kpis.kitchenTrendPct}
          spark={kpis.kitchenSpark}
          lowerIsBetter
          icon={Clock}
          accent="brand"
        />
      </div>

      {/* Reservations overview */}
      {resStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Today's covers"
            value={String(resStats.covers)}
            sublabel="Expected guests from reservations"
            icon={Users}
            accent="brand"
          />
          <KpiCard
            label="Reservations today"
            value={String(resStats.count)}
            icon={CalendarDays}
            accent="accent"
          />
          <KpiCard
            label="No-shows today"
            value={String(resStats.noShows)}
            icon={UserX}
            accent={resStats.noShows > 0 ? "neutral" : "brand"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <CalendarDays className="size-5 text-brand" />
              Upcoming reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No upcoming reservations across branches.
              </p>
            ) : (
              <ul className="space-y-3">
                {reservations.slice(0, 6).map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-subtle/40 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">{r.guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSlotLabel(r.date, r.time)} · {r.partySize} guests
                      </p>
                    </div>
                    <ReservationStatusPill status={r.status} dot={false} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Reservation tasks</CardTitle>
            <p className="text-sm text-muted-foreground">Reminders and urgent confirmations</p>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              <ul className="space-y-3">
                {tasks.slice(0, 6).map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "rounded-xl border px-4 py-3",
                      t.type === "urgent-confirm"
                        ? "border-red-200 bg-red-50/80"
                        : "border-amber-200 bg-accent-tint/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{t.guestName}</p>
                      {t.type === "urgent-confirm" && (
                        <StatusPill tone="red" dot={false}>
                          Urgent
                        </StatusPill>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.slotLabel}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs orders + target gauge */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Revenue &amp; orders</CardTitle>
            <p className="text-sm text-muted-foreground">
              {period === "day" ? "Last 7 days" : period === "month" ? "Last 12 months" : "3-year trend"}
              {" "}· revenue vs order volume
            </p>
          </CardHeader>
          <CardContent>
            <RevenueOrdersChart data={data.revenueSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Target className="size-5 text-brand" />
            <CardTitle className="font-display text-base">Revenue target</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetGauge
              target={data.target}
              periodLabel={period === "day" ? "daily" : period === "month" ? "monthly" : "annual"}
            />
          </CardContent>
        </Card>
      </div>

      {/* Peak hours heatmap */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Flame className="size-5 text-brand" />
          <div>
            <CardTitle className="font-display">Peak hours</CardTitle>
            <p className="text-sm text-muted-foreground">Order volume by day &amp; hour</p>
          </div>
        </CardHeader>
        <CardContent>
          <PeakHoursHeatmap data={data.hourlyHeatmap} />
        </CardContent>
      </Card>

      {/* Category mix · payment & fulfillment · customers */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Sales by category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={data.categorySplit} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CreditCard className="size-5 text-brand" />
            <CardTitle className="font-display text-base">Payments &amp; fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-ink">Payment method</h3>
              <ShareBars
                items={data.paymentSplit.map((p) => ({
                  label: p.label,
                  pct: p.pct,
                  hint: formatCurrency(p.amount),
                }))}
              />
            </div>
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-ink">Fulfillment</h3>
              <ShareBars
                items={data.fulfillment.map((f) => ({
                  label: f.label,
                  pct: f.pct,
                  hint: `${f.orders.toLocaleString()} orders`,
                }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Repeat className="size-5 text-brand" />
            <CardTitle className="font-display text-base">Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-subtle/40 p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UserPlus className="size-3.5" /> New
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {data.customers.newCount}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-subtle/40 p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" /> Returning
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {data.customers.returningCount}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Returning share</span>
                <span className="font-semibold text-ink">{data.customers.returningPct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${data.customers.returningPct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Repeat rate</span>
              <span className="font-semibold text-ink">{data.customers.repeatRatePct}%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Avg visits / month</span>
              <span className="font-semibold text-ink">{data.customers.avgVisitsPerMonth}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales mix by channel & branch */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Sales mix</CardTitle>
          <p className="text-sm text-muted-foreground">Revenue share by channel and branch</p>
        </CardHeader>
        <CardContent className="grid gap-8 sm:grid-cols-2">
          <SplitBars title="By channel" items={data.channelSplit} />
          <SplitBars title="By branch" items={data.branchSplit} />
        </CardContent>
      </Card>

      {/* Best sellers + staff */}
      <div className={cn("grid gap-6", data.staffPerformance.length > 0 && "lg:grid-cols-2")}>
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Best-selling items</CardTitle>
            <p className="text-sm text-muted-foreground">Top performers this period</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.bestSellers.map((item, idx) => (
                <li
                  key={item.menuItemId}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-subtle/40 px-4 py-3 transition-colors hover:bg-subtle"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint font-display text-sm font-bold text-brand-deep">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} sold</p>
                  </div>
                  <span className="shrink-0 font-semibold text-ink">
                    {formatCurrency(item.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {data.staffPerformance.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="size-5 text-brand" />
            <div>
              <CardTitle className="font-display">Staff performance</CardTitle>
              <p className="text-sm text-muted-foreground">Response times & SLA adherence</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-subtle/60 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Team member</th>
                    <th className="px-4 py-3">Ack (avg)</th>
                    <th className="px-4 py-3">Serve (avg)</th>
                    <th className="px-4 py-3">SLA</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staffPerformance.map((row) => (
                    <tr
                      key={row.staffId}
                      className="border-b border-border/50 transition-colors hover:bg-subtle/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.avatarUrl && (
                            <Image
                              src={row.avatarUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="size-8 rounded-full border border-border object-cover"
                              unoptimized
                            />
                          )}
                          <div>
                            <p className="font-medium text-ink">{row.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ROLE_LABELS[row.role]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.avgAcknowledgeMins > 0 ? `${row.avgAcknowledgeMins}m` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.avgServeMins > 0 ? `${row.avgServeMins}m` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.slaBreaches > 0 ? (
                          <StatusPill tone="red" dot={false}>
                            {row.slaBreaches}
                          </StatusPill>
                        ) : (
                          <StatusPill tone="green" dot={false}>
                            0
                          </StatusPill>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{row.ordersHandled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
