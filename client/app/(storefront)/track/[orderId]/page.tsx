"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Clock,
  MapPin,
  MessageSquare,
  Package,
  Store,
  Timer,
  User,
} from "lucide-react";
import { OrderTimeline } from "@/features/order/components/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchStorefrontOrder,
  type StorefrontOrder,
} from "@/features/storefront/services/storefront-orders";
import { useOrderStream } from "@/hooks/use-order-stream";
import type { Order } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

// Safety-net reconcile poll — SSE delivers updates instantly; this only catches
// anything missed during a reconnect (and refreshes items/totals if they change).
const RECONCILE_INTERVAL_MS = 30_000;

const TERMINAL = new Set(["completed", "cancelled"]);

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<StorefrontOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLive = Boolean(order) && !TERMINAL.has(order?.status ?? "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await fetchStorefrontOrder(orderId);
        if (!cancelled) {
          if (!o) setError("Order not found");
          else setOrder(o);
        }
      } catch {
        if (!cancelled) setError("Could not load order");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Realtime status via SSE (primary).
  const onStatus = useCallback(
    ({ status }: { status: Order["status"] }) =>
      setOrder((prev) => (prev ? { ...prev, status } : prev)),
    [],
  );
  const { connected } = useOrderStream(orderId, onStatus, isLive);

  // Reconcile poll (fallback) — refetch the whole order periodically until done.
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(async () => {
      const updated = await fetchStorefrontOrder(orderId);
      if (updated) setOrder(updated);
    }, RECONCILE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLive, orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <EmptyState
          icon={Package}
          title={error ?? "Order not found"}
          action={
            <Button asChild variant="outline">
              <Link href="/order">Place a new order</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <OrderStatusPill status={order.status} className="mb-3" />
        <h1 className="font-display text-2xl font-bold text-ink">Order {order.reference}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.fulfillmentType === "delivery" ? "Delivery" : "Pickup"} ·{" "}
          {formatCurrency(order.total)}
        </p>
      </div>

      {/* Fulfillment + contact details. */}
      <Card className="mb-6">
        <CardContent className="space-y-3 p-4">
          {order.branchName && (
            <div className="flex items-start gap-3">
              <Store className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">From</p>
                <p className="text-sm text-muted-foreground">{order.branchName}</p>
              </div>
            </div>
          )}

          <div className={cn("flex items-start gap-3", order.branchName && "border-t border-border pt-3")}>
            {order.fulfillmentType === "delivery" ? (
              <>
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Delivering to</p>
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress || "Address on file"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Pickup</p>
                  <p className="text-sm text-muted-foreground">
                    {order.pickupTime ? `Ready at ${order.pickupTime}` : "Collect in-store"}
                  </p>
                </div>
              </>
            )}
          </div>

          {order.fulfillmentType === "delivery" && (
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <Timer className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Estimated delivery</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const eta = order.deliveryEtaMinutes ?? 30;
                    const at = new Date(new Date(order.placedAt).getTime() + eta * 60_000);
                    return `~${at.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })} · about ${eta} min`;
                  })()}
                </p>
              </div>
            </div>
          )}

          {(order.customerName || order.customerPhone) && (
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <User className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Contact</p>
                <p className="text-sm text-muted-foreground">
                  {[order.customerName, order.customerPhone].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          )}

          {order.note && (
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <MessageSquare className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Note</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{order.note}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 border-t border-border pt-3">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-ink">Placed</p>
              <p className="text-sm text-muted-foreground">
                {new Date(order.placedAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Order progress</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline status={order.status} fulfillmentType={order.fulfillmentType} />
          {isLive && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block size-2 rounded-full",
                  connected ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40",
                )}
              />
              {connected ? "Live — updates in real time" : "Reconnecting…"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Items
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              ({order.items.reduce((n, i) => n + i.quantity, 0)})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/order">Order again</Link>
        </Button>
        <Button asChild>
          <Link href="/account">View history</Link>
        </Button>
      </div>
    </div>
  );
}
