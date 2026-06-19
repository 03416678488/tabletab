"use client";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { ElapsedTimer } from "@/components/ops/elapsed-timer";
import { formatBuffetSummary } from "@/lib/buffet-utils";
import { orderTableLabel } from "@/lib/order-display";
import type { Branch, Order } from "@/lib/types";
import { isSlaBreached } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface KitchenOrderCardProps {
  order: Order;
  branch: Branch;
  column: "new" | "preparing" | "ready";
  onAcknowledge?: () => void;
  onMarkReady?: () => void;
  busy?: boolean;
  /** Buffet replenishment card — no per-dish tickets */
  buffetMode?: boolean;
  scheduled?: boolean;
  nowMs?: number;
}

export function KitchenOrderCard({
  order,
  branch,
  column,
  onAcknowledge,
  onMarkReady,
  busy,
  buffetMode,
  scheduled,
  nowMs = Date.now(),
}: KitchenOrderCardProps) {
  const sla = isSlaBreached(order);
  const timerSince = order.acceptedAt ?? order.placedAt;
  const fireAtMs = order.fireAt ? new Date(order.fireAt).getTime() : null;
  const minsUntilFire =
    fireAtMs && fireAtMs > nowMs ? Math.ceil((fireAtMs - nowMs) / 60_000) : null;

  return (
    <article
      className={cn(
        "rounded-xl border bg-kitchen-panel p-4 shadow-lg transition-colors",
        scheduled && "border-amber-500/50 bg-amber-950/20",
        !scheduled && sla
          ? "animate-pulse border-red-500 ring-2 ring-red-500/40"
          : !scheduled && "border-kitchen-line",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold text-white">{order.reference}</p>
          <p className="text-sm text-slate-300">{orderTableLabel(order, branch)}</p>
        </div>
        <ElapsedTimer since={timerSince} slaBreached={sla && !scheduled} />
      </div>

      {order.fireAt && (
        <div className="mt-2">
          <StatusPill
            tone="amber"
            dark
            className="border-amber-500/50 bg-amber-950/80 text-amber-200"
          >
            Prepare at{" "}
            {new Date(order.fireAt).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
            {minsUntilFire != null && minsUntilFire > 0 && ` · in ${minsUntilFire} min`}
          </StatusPill>
        </div>
      )}

      {order.reservationId && (
        <StatusPill
          tone="blue"
          dark
          className="mt-2 border-kitchen-line bg-kitchen-bg/80 text-slate-200"
        >
          Reservation pre-order
        </StatusPill>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatusPill
          tone={order.channel === "in-venue" ? "brand" : "amber"}
          dark
          className="border-kitchen-line bg-kitchen-bg/80 text-slate-200"
        >
          {order.channel === "in-venue" ? "Dine-in" : "Online"}
        </StatusPill>
        {sla && (
          <StatusPill tone="red" dark className="border-red-500/50 bg-red-950/80 text-red-300">
            SLA breach
          </StatusPill>
        )}
      </div>

      <p className="mt-2 text-sm font-medium text-slate-200">{order.customerName}</p>

      {order.buffet && (
        <div
          className={cn(
            "mt-3 rounded-lg border p-3",
            buffetMode
              ? "border-teal-500/50 bg-teal-950/40"
              : "border-kitchen-line bg-kitchen-bg/60",
          )}
        >
          <p className="font-display text-base font-bold text-white">
            Buffet · {order.buffet.totalCovers} covers
          </p>
          <p className="mt-1 text-sm text-slate-300">{order.buffet.packageName}</p>
          <p className="mt-1 text-xs text-slate-400">{formatBuffetSummary(order.buffet)}</p>
        </div>
      )}

      {order.items.length > 0 && (
      <ul className="mt-3 space-y-2 border-t border-kitchen-line pt-3">
        {buffetMode && (
          <li className="text-xs font-medium uppercase tracking-wide text-slate-500">
            À la carte extras
          </li>
        )}
        {order.items.map((item, i) => (
          <li key={i} className="text-sm text-slate-200">
            <span className="font-semibold text-white">{item.quantity}×</span> {item.name}
            {item.modifiers.length > 0 && (
              <span className="block text-xs text-slate-400">
                {item.modifiers.map((m) => m.label).join(", ")}
              </span>
            )}
            {item.notes && (
              <span className="mt-0.5 block text-xs font-medium text-amber-300">
                Note: {item.notes}
              </span>
            )}
          </li>
        ))}
      </ul>
      )}

      {column === "new" && onAcknowledge && !scheduled && (
        <Button
          className="mt-4 w-full"
          size="sm"
          disabled={busy}
          onClick={onAcknowledge}
        >
          Acknowledge → Preparing
        </Button>
      )}
      {column === "preparing" && onMarkReady && (
        <Button
          className="mt-4 w-full"
          size="sm"
          variant="accent"
          disabled={busy}
          onClick={onMarkReady}
        >
          Mark ready
        </Button>
      )}
    </article>
  );
}
