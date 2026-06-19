"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, RefreshCw, UtensilsCrossed } from "lucide-react";
import { KitchenOrderCard } from "@/components/kitchen/kitchen-order-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveOps } from "@/hooks/use-live-ops";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { kitchenColumn, sortKitchenOrders } from "@/lib/order-display";
import type { Order } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

const COLUMNS = [
  { id: "new" as const, label: "New", subtitle: "Unacknowledged" },
  { id: "preparing" as const, label: "Preparing", subtitle: "In progress" },
  { id: "ready" as const, label: "Ready", subtitle: "Awaiting pickup / serve" },
];

export function KitchenBoard() {
  const activeBranch = useSession((s) => s.activeBranch);
  const { orders, loading, error, refresh, tick } = useLiveOps({
    branchId: activeBranch.id,
    simulateOrders: true,
  });
  const [scheduled, setScheduled] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadScheduled = useCallback(async () => {
    const list = await api.getScheduledKitchenOrders(activeBranch.id);
    setScheduled(list);
  }, [activeBranch.id]);

  useEffect(() => {
    loadScheduled();
    const poll = setInterval(loadScheduled, 5000);
    return () => clearInterval(poll);
  }, [loadScheduled]);

  const kitchenOrders = useMemo(() => {
    const now = Date.now();
    const active = orders.filter((o) => {
      if (!["placed", "accepted", "preparing", "ready"].includes(o.status)) return false;
      if (o.fireAt && new Date(o.fireAt).getTime() > now) return false;
      return true;
    });
    return sortKitchenOrders(active);
  }, [orders, tick]);

  const buffetOrders = useMemo(
    () => kitchenOrders.filter((o) => o.buffet),
    [kitchenOrders],
  );

  const ticketOrders = useMemo(
    () => kitchenOrders.filter((o) => o.items.length > 0),
    [kitchenOrders],
  );

  const byColumn = useMemo(() => {
    const map: Record<"new" | "preparing" | "ready", Order[]> = {
      new: [],
      preparing: [],
      ready: [],
    };
    for (const o of ticketOrders) {
      map[kitchenColumn(o)].push(o);
    }
    return map;
  }, [ticketOrders]);

  const runAction = async (orderId: string, action: () => Promise<unknown>) => {
    setBusyId(orderId);
    try {
      await action();
      await refresh();
      await loadScheduled();
    } catch {
      toast("Action failed", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 rounded-xl bg-kitchen-panel" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Kitchen display</h1>
          <p className="text-sm text-slate-400">
            {activeBranch.name.replace("Olive & Ash — ", "")} · Live board
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-kitchen-line bg-kitchen-panel text-slate-200 hover:bg-kitchen-line"
          onClick={() => {
            refresh();
            loadScheduled();
          }}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {scheduled.length > 0 && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-amber-200">
            <Clock className="size-5" />
            Scheduled pre-orders
            <StatusPill tone="amber" dark className="border-amber-500/50 bg-amber-950/80">
              {scheduled.length}
            </StatusPill>
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {scheduled.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                branch={activeBranch}
                column="new"
                scheduled
                nowMs={Date.now()}
              />
            ))}
          </div>
        </section>
      )}

      {buffetOrders.length > 0 && (
        <section className="rounded-xl border border-teal-500/40 bg-teal-950/30 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-teal-200">
            <UtensilsCrossed className="size-5" />
            Buffet service
            <StatusPill tone="brand" dark className="border-teal-500/50 bg-teal-950/80">
              {buffetOrders.reduce((s, o) => s + (o.buffet?.totalCovers ?? 0), 0)} covers
            </StatusPill>
          </h2>
          <p className="mb-3 text-xs text-teal-300/80">
            Replenishment awareness only — no individual dish tickets for buffet covers.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {buffetOrders.map((order) => (
              <KitchenOrderCard
                key={`buffet-${order.id}`}
                order={order}
                branch={activeBranch}
                column={kitchenColumn(order)}
                buffetMode
                busy={busyId === order.id}
                nowMs={Date.now()}
                onAcknowledge={
                  kitchenColumn(order) === "new"
                    ? () => runAction(order.id, () => api.acknowledgeOrder(order.id))
                    : undefined
                }
                onMarkReady={
                  kitchenColumn(order) === "preparing"
                    ? () => runAction(order.id, () => api.markOrderReady(order.id))
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.id} className="flex min-h-[320px] flex-col rounded-xl bg-kitchen-bg/60 p-3">
            <header className="mb-3 border-b border-kitchen-line pb-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-white">{col.label}</h2>
                <span className="rounded-full bg-kitchen-panel px-2.5 py-0.5 text-xs font-medium text-slate-300">
                  {byColumn[col.id].length}
                </span>
              </div>
              <p className="text-xs text-slate-500">{col.subtitle}</p>
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {byColumn[col.id].length === 0 ? (
                <EmptyState
                  title="No orders"
                  description={`Nothing in ${col.label.toLowerCase()} right now.`}
                  className="border-kitchen-line bg-kitchen-panel/50 py-8 text-slate-400 [&_h3]:text-slate-300"
                />
              ) : (
                byColumn[col.id].map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    branch={activeBranch}
                    column={col.id}
                    busy={busyId === order.id}
                    nowMs={Date.now()}
                    onAcknowledge={
                      col.id === "new"
                        ? () => runAction(order.id, () => api.acknowledgeOrder(order.id))
                        : undefined
                    }
                    onMarkReady={
                      col.id === "preparing"
                        ? () => runAction(order.id, () => api.markOrderReady(order.id))
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}