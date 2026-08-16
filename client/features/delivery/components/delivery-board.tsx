"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, MapPin, Navigation, Package, Phone, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { cn, formatCurrency } from "@/lib/utils";
import { orderService } from "@/features/order/services/order.service";
import { useDeliveryQueue } from "@/features/delivery/hooks/use-delivery-queue";
import { markCategoryReadLive } from "@/features/notifications/lib/notifications-client";
import type { Order, OrderStatus } from "@/features/order/types/order.types";

/** The rider's active work queue: ready to pick up → out for delivery. */
export function DeliveryBoard() {
  const { ready, outForDelivery, loading, refetch } = useDeliveryQueue();
  const [busyId, setBusyId] = useState<string | null>(null);
  const inFlight = useRef<Set<string>>(new Set());
  // Opening the rider queue consumes the order notifications (auto-read).
  useEffect(() => void markCategoryReadLive("orders"), []);

  const move = async (order: Order, next: OrderStatus) => {
    if (inFlight.current.has(order.id)) return;
    inFlight.current.add(order.id);
    setBusyId(order.id);
    try {
      await orderService.update(order.id, { status: next });
      await refetch();
    } catch {
    } finally {
      inFlight.current.delete(order.id);
      setBusyId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <Bike className="size-5 text-brand" /> Deliveries
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ready.length} ready · {outForDelivery.length} out for delivery
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="size-4" /> Refresh
        </Button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Column
          title="Ready to pick up"
          tone="brand"
          count={ready.length}
          loading={loading}
          empty="No orders waiting for pickup."
        >
          {ready.map((o) => (
            <DeliveryCard
              key={o.id}
              order={o}
              busy={busyId === o.id}
              actionLabel="Start delivery"
              onAction={() => move(o, "out-for-delivery")}
            />
          ))}
        </Column>

        <Column
          title="Out for delivery"
          tone="blue"
          count={outForDelivery.length}
          loading={loading}
          empty="Nothing in transit right now."
        >
          {outForDelivery.map((o) => (
            <DeliveryCard
              key={o.id}
              order={o}
              busy={busyId === o.id}
              actionLabel="Mark delivered"
              onAction={() => move(o, "delivered")}
            />
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({
  title,
  tone,
  count,
  loading,
  empty,
  children,
}: {
  title: string;
  tone: "brand" | "blue";
  count: number;
  loading: boolean;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display font-semibold text-ink">{title}</h2>
        <span
          className={cn(
            "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
            tone === "brand" ? "bg-brand-tint text-brand-deep" : "bg-sky-50 text-sky-700",
          )}
        >
          {count}
        </span>
      </div>
      {loading && count === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : count === 0 ? (
        <Card className="p-8">
          <EmptyState icon={Package} title="All clear" description={empty} />
        </Card>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}

function DeliveryCard({
  order,
  busy,
  actionLabel,
  onAction,
}: {
  order: Order;
  busy: boolean;
  actionLabel: string;
  onAction: () => void;
}) {
  const mapsUrl = order.customerAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress)}`
    : null;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-semibold text-ink">{order.orderNumber}</p>
          <p className="text-sm text-muted-foreground">
            {order.customerName ?? "Customer"} · {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
            {formatCurrency(order.total)}
          </p>
        </div>
        <StatusPill tone={order.paymentStatus === "paid" ? "green" : "amber"}>
          {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
        </StatusPill>
      </div>

      {order.customerAddress && (
        <p className="flex items-start gap-1.5 text-sm text-ink">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
          {order.customerAddress}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {order.customerPhone && (
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${order.customerPhone}`}>
              <Phone className="size-4" /> Call
            </a>
          </Button>
        )}
        {mapsUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-4" /> Navigate
            </a>
          </Button>
        )}
        <Button size="sm" className="ml-auto" onClick={onAction} disabled={busy}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
