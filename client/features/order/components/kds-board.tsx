"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChefHat, Clock, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useOrderBoard } from "@/features/order/hooks/use-order-board";
import { orderService } from "@/features/order/services/order.service";
import {
  ORDER_TYPE_META,
  nextStatus,
} from "@/features/order/constants/order.constants";
import type { Order, OrderStatus } from "@/features/order/types/order.types";

const COLUMNS: {
  status: Extract<OrderStatus, "placed" | "confirmed" | "preparing" | "ready">;
  title: string;
  action: string;
  accent: string;
  headBar: string;
  countPill: string;
}[] = [
  {
    status: "placed",
    title: "New",
    action: "Confirm",
    accent: "border-l-amber-400",
    headBar: "bg-amber-500",
    countPill: "bg-amber-600/30",
  },
  {
    status: "confirmed",
    title: "Confirmed",
    action: "Start",
    accent: "border-l-sky-400",
    headBar: "bg-sky-500",
    countPill: "bg-sky-600/30",
  },
  {
    status: "preparing",
    title: "Preparing",
    action: "Mark Ready",
    accent: "border-l-violet-400",
    headBar: "bg-violet-500",
    countPill: "bg-violet-700/30",
  },
  {
    status: "ready",
    title: "Ready",
    action: "Complete",
    accent: "border-l-emerald-400",
    headBar: "bg-emerald-500",
    countPill: "bg-emerald-700/30",
  },
];

/** Live-updating clock so ticket timers tick every second. */
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function elapsed(iso: string, now: number) {
  const secs = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return { label: `${m}:${s.toString().padStart(2, "0")}`, mins: m };
}

export function KdsBoard() {
  const { orders, loading, error, lastUpdated, refetch, connected } = useOrderBoard();
  const now = useNow();
  const [busyId, setBusyId] = useState<string | null>(null);
  const inFlight = useRef<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<string, Order[]> = {
      placed: [],
      confirmed: [],
      preparing: [],
      ready: [],
    };
    for (const o of orders) map[o.status]?.push(o);
    return map;
  }, [orders]);

  const bump = async (order: Order) => {
    const next = nextStatus(order.status);
    if (!next || inFlight.current.has(order.id)) return; // one step per click
    inFlight.current.add(order.id);
    setBusyId(order.id);
    try {
      await orderService.update(order.id, { status: next });
      await refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", { tone: "error" });
    } finally {
      inFlight.current.delete(order.id);
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <ChefHat className="size-5 text-brand" /> Kitchen Display
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {orders.length} active ticket{orders.length === 1 ? "" : "s"} ·
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                connected ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40",
              )}
            />
            {connected ? "Live" : "Reconnecting…"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="size-4" /> Refresh
          <span className="ml-1 text-xs text-muted-foreground">
            {new Date(lastUpdated).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = grouped[col.status] ?? [];
          return (
            <div key={col.status} className="flex min-w-0 flex-col">
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-white shadow-sm",
                  col.headBar,
                )}
              >
                <span className="font-display text-base font-bold uppercase tracking-wide">
                  {col.title}
                </span>
                <span
                  className={cn(
                    "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-sm font-bold tabular-nums",
                    col.countPill,
                  )}
                >
                  {list.length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl" />
                  ))
                ) : list.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                    Nothing here.
                  </p>
                ) : (
                  list.map((order) => (
                    <Ticket
                      key={order.id}
                      order={order}
                      now={now}
                      accent={col.accent}
                      action={col.action}
                      busy={busyId === order.id}
                      onBump={() => bump(order)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Ticket({
  order,
  now,
  accent,
  action,
  busy,
  onBump,
}: {
  order: Order;
  now: number;
  accent: string;
  action: string;
  busy: boolean;
  onBump: () => void;
}) {
  const { label, mins } = elapsed(order.createdAt, now);
  const where =
    order.table?.name ??
    order.customer?.name ??
    order.customerName ??
    ORDER_TYPE_META[order.orderType].label;

  return (
    <div
      className={cn(
        "rounded-2xl border border-l-4 border-border bg-card p-3 shadow-[var(--shadow-card)]",
        accent,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{order.orderNumber}</p>
          <p className="truncate text-xs text-muted-foreground">
            {ORDER_TYPE_META[order.orderType].label} · {where}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            mins >= 10
              ? "bg-red-50 text-red-600"
              : mins >= 5
                ? "bg-amber-50 text-amber-700"
                : "bg-secondary text-muted-foreground",
          )}
        >
          <Clock className="size-3" />
          {label}
        </span>
      </div>

      <ul className="mt-2.5 space-y-1.5 border-t border-border pt-2.5">
        {order.items.map((it) => (
          <li key={it.id} className="text-sm">
            <div className="flex gap-2">
              <span className="font-semibold text-brand">{it.quantity}×</span>
              <span className="min-w-0 flex-1 text-ink">{it.name}</span>
            </div>
            {it.notes && (
              <p className="ml-6 text-xs italic text-muted-foreground">{it.notes}</p>
            )}
          </li>
        ))}
      </ul>

      <Button className="mt-3 w-full" size="sm" disabled={busy} onClick={onBump}>
        {action}
      </Button>
    </div>
  );
}
