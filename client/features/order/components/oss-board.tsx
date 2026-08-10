"use client";

import { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/datetime";
import { useOrderBoard } from "@/features/order/hooks/use-order-board";
import { useNewArrivals } from "@/features/order/hooks/use-new-arrivals";
import { SoundToggle } from "@/features/order/components/sound-toggle";
import { playNewOrderChime, primeChime } from "@/features/order/lib/chime";
import { markCategoryReadLive } from "@/features/notifications/lib/notifications-client";
import type { Order } from "@/features/order/types/order.types";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function label(order: Order): string | null {
  return order.table?.name ?? order.customer?.name ?? order.customerName ?? null;
}

export function OssBoard() {
  const { orders, loading } = useOrderBoard(6000);
  const clock = useClock();
  const orderIds = useMemo(() => orders.map((o) => o.id), [orders]);
  useEffect(() => primeChime(), []);
  useEffect(() => void markCategoryReadLive("orders"), []);
  const newIds = useNewArrivals(orderIds, {
    ready: !loading,
    onArrive: () => playNewOrderChime(),
  });

  const { preparing, ready } = useMemo(() => {
    return {
      // Everything not yet ready reads as "in progress" to a guest.
      preparing: orders.filter((o) => o.status !== "ready"),
      ready: orders.filter((o) => o.status === "ready"),
    };
  }, [orders]);

  return (
    <div className="min-h-[calc(100vh-8rem)] rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white sm:p-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10">
            <UtensilsCrossed className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Order Status</h1>
            <p className="text-sm text-white/60">Watch for your number below</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SoundToggle variant="dark" />
          <div className="text-right">
            <p className="font-display text-3xl font-bold tabular-nums">{formatTime(clock)}</p>
            <p className="text-xs text-white/50">{loading ? "Loading…" : "Live"}</p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Column
          title="Preparing"
          accent="text-amber-300"
          dot="bg-amber-400"
          empty="No orders cooking."
          orders={preparing}
          variant="preparing"
          newIds={newIds}
        />
        <Column
          title="Ready for Pickup"
          accent="text-emerald-300"
          dot="bg-emerald-400"
          empty="Nothing ready yet."
          orders={ready}
          variant="ready"
          newIds={newIds}
        />
      </div>
    </div>
  );
}

function Column({
  title,
  accent,
  dot,
  empty,
  orders,
  variant,
  newIds,
}: {
  title: string;
  accent: string;
  dot: string;
  empty: string;
  orders: Order[];
  variant: "preparing" | "ready";
  newIds: Set<string>;
}) {
  return (
    <section className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="flex items-center gap-2.5">
        <span className={cn("size-3 rounded-full", dot, variant === "ready" && "animate-pulse")} />
        <h2 className={cn("font-display text-lg font-bold uppercase tracking-wide", accent)}>
          {title}
        </h2>
        <span className="ml-auto rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="py-14 text-center text-white/40">{empty}</p>
      ) : (
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {orders.map((order) => {
            const sub = label(order);
            return (
              <div
                key={order.id}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl px-3 py-5 text-center transition-colors",
                  variant === "ready"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-white/10 text-white ring-1 ring-white/10",
                  newIds.has(order.id) && "animate-new-order",
                )}
              >
                <span className="font-display text-2xl font-bold tracking-tight">
                  {order.orderNumber.replace(/^ORD-/, "#")}
                </span>
                {sub && (
                  <span
                    className={cn(
                      "mt-1 truncate text-xs",
                      variant === "ready" ? "text-white/80" : "text-white/50",
                    )}
                  >
                    {sub}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
