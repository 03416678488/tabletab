"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Flame,
  Repeat,
  PartyPopper,
  Target,
  Wallet,
  UserPlus,
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
import {
  DateRangeFilter,
  defaultDateRange,
  type DateRange,
} from "@/components/ui/date-range-filter";
import { ROLE_LABELS } from "@/lib/nav";
import { analyticsService } from "@/features/admin/services/analytics.service";
import {
  listReservations,
  type StorefrontReservation,
} from "@/features/reserve/services/reservation.service";
import { fetchReservationSettings } from "@/features/reserve/services/reservation-settings.service";
import { deriveReservationTasks, formatSlotLabel } from "@/lib/reservation-utils";
import type { OwnerAnalytics, ReservationTask } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useActiveBranch, isAllBranches } from "@/features/branch/hooks/use-active-branch";
import { useSession } from "@/hooks/use-session";

/** Series granularity label from the range span (matches the API's auto-bucketing). */
function granularityLabel(range: { from: string; to: string }): string {
  const days = (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000;
  return days <= 62 ? "daily" : days <= 731 ? "monthly" : "annual";
}

export function AdminDashboard() {
  const { get } = useSettings();
  const brandName = get("company", "name") || "Your restaurant";
  const user = useSession((s) => s.user);
  const greetName = user?.name?.trim().split(/\s+/)[0] || (user ? ROLE_LABELS[user.role] : "");
  // Scope KPIs to the topbar branch selection ("All branches" → undefined = all).
  const activeBranchId = useActiveBranch((s) => s.activeBranchId);
  const branchId = activeBranchId && !isAllBranches(activeBranchId) ? activeBranchId : undefined;
  const [range, setRange] = useState<DateRange>(defaultDateRange());
  const [data, setData] = useState<OwnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<StorefrontReservation[]>([]);
  const [reminderLead, setReminderLead] = useState(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    analyticsService
      .getOwnerAnalytics(range, branchId)
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
  }, [range.from, range.to, branchId]);

  // Real reservations for the two overview cards, scoped to the active branch
  // (or all branches when none is selected). Slow-polls to stay fresh.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await listReservations(branchId);
        if (!cancelled) setReservations(list);
      } catch {
        /* keep last good data */
      }
    };
    void load();
    const poll = setInterval(() => void load(), 30000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [branchId]);

  // Reminder lead (mins) comes from the selected branch's reservation settings
  // and drives the derived reminder tasks.
  useEffect(() => {
    if (!branchId) {
      setReminderLead(30);
      return;
    }
    fetchReservationSettings(branchId)
      .then((s) => setReminderLead(s.reminderLeadMins))
      .catch(() => undefined);
  }, [branchId]);

  // Local Y-M-D (not UTC — avoids hiding today's bookings in +offset zones).
  const today = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
      n.getDate(),
    ).padStart(2, "0")}`;
  }, []);

  // Today's covers / count / no-shows, computed from the real bookings.
  const resStats = useMemo(() => {
    const todays = reservations.filter((r) => r.date === today);
    const covers = todays
      .filter((r) => !["cancelled", "no-show"].includes(r.status))
      .reduce((s, r) => s + r.partySize, 0);
    const noShows = todays.filter((r) => r.status === "no-show").length;
    return { covers, noShows, count: todays.length };
  }, [reservations, today]);

  // Upcoming = today or later and still active (requested/confirmed/seated).
  const upcoming = useMemo(
    () =>
      reservations
        .filter((r) => r.date >= today && ["requested", "confirmed", "seated"].includes(r.status))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [reservations, today],
  );

  // Reminder + urgent-confirm tasks, derived from the same real bookings.
  const tasks: ReservationTask[] = useMemo(
    () => deriveReservationTasks(reservations, reminderLead),
    [reservations, reminderLead],
  );

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
  const rangeRevenue = data.revenueSeries.reduce((s, p) => s + p.revenue, 0);
  const rangeOrders = data.revenueSeries.reduce((s, p) => s + p.orders, 0);
  const rangeAov = rangeOrders ? rangeRevenue / rangeOrders : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{greetName ? `, ${greetName}` : ""} — {brandName} at a glance.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {/* KPI row (compact) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          compact
          label="Today's revenue"
          value={formatCurrency(kpis.revenueToday)}
          trend={kpis.revenueTrendPct}
          spark={kpis.revenueSpark}
          accent="brand"
        />
        <KpiCard
          compact
          label="Orders today"
          value={String(kpis.ordersToday)}
          trend={kpis.ordersTrendPct}
          spark={kpis.ordersSpark}
          accent="accent"
        />
        <KpiCard
          compact
          label="Avg order value"
          value={formatCurrency(kpis.avgOrderValue)}
          trend={kpis.avgOrderTrendPct}
          spark={kpis.aovSpark}
          accent="neutral"
        />
        <KpiCard
          compact
          label="Avg kitchen response"
          value={`${kpis.avgKitchenResponseMins} min`}
          trend={kpis.kitchenTrendPct}
          spark={kpis.kitchenSpark}
          lowerIsBetter
          accent="brand"
        />
      </div>

      {/* Sales overview (range totals + chart) + revenue target */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Sales overview</CardTitle>
            <p className="text-sm text-muted-foreground">{range.label} · revenue vs orders</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-subtle/40">
              <div className="px-4 py-3">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">
                  {formatCurrency(rangeRevenue)}
                </p>
              </div>
              <div className="border-l border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">
                  {rangeOrders.toLocaleString()}
                </p>
              </div>
              <div className="border-l border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Avg order</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">
                  {formatCurrency(rangeAov)}
                </p>
              </div>
            </div>
            <RevenueOrdersChart data={data.revenueSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Target className="size-5 text-brand" />
            <CardTitle className="font-display text-base">Revenue target</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetGauge target={data.target} periodLabel={granularityLabel(range)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <CalendarDays className="size-5 text-brand" />
              Upcoming reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No upcoming reservations across branches.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.slice(0, 6).map((r) => (
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

      {/* Bookings snapshot — today's reservations + booking earnings for range */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-display text-base">Bookings &amp; earnings</CardTitle>
          <span className="text-xs text-muted-foreground">{range.label}</span>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {resStats && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Covers today", value: resStats.covers },
                { label: "Reservations", value: resStats.count },
                { label: "No-shows", value: resStats.noShows },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border/60 bg-subtle/40 px-3 py-2.5 text-center"
                >
                  <p className="font-display text-2xl font-bold text-ink">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarCheck className="size-4 text-brand" /> Reservation deposits
              </span>
              <span className="font-semibold text-ink">
                {formatCurrency(data.ancillaryEarnings.reservationDeposits)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <PartyPopper className="size-4 text-brand" /> Event payments
              </span>
              <span className="font-semibold text-ink">
                {formatCurrency(data.ancillaryEarnings.eventPayments)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-brand-tint/50 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium text-brand-deep">
                <Wallet className="size-4" /> Booking earnings
              </span>
              <span className="font-display font-bold text-brand-deep">
                {formatCurrency(data.ancillaryEarnings.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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
      <div className="grid gap-4 lg:grid-cols-3">
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
      <div className={cn("grid gap-4", data.staffPerformance.length > 0 && "lg:grid-cols-2")}>
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
