"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { OrderTimeline } from "@/components/order/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const ADVANCE_INTERVAL_MS = 8000;

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await api.getOrder(orderId);
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

  useEffect(() => {
    if (!order || order.status === "completed" || order.status === "cancelled") return;

    const timer = setInterval(async () => {
      const updated = await api.advanceOrderStatus(orderId);
      if (updated) setOrder(updated);
    }, ADVANCE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [order, orderId]);

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Order progress</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline status={order.status} fulfillmentType={order.fulfillmentType} />
          {order.status !== "completed" && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Status updates automatically every few seconds (demo).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
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
