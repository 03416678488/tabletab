"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { VenueTimeline } from "@/components/venue/venue-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useVenueStore } from "@/hooks/use-venue-store";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const ADVANCE_MS = 7000;

export function VenueOrderStatus() {
  const activeOrderId = useVenueStore((s) => s.activeOrderId);
  const setCartOpen = useVenueStore((s) => s.setCartOpen);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeOrderId) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const o = await api.getOrder(activeOrderId);
      if (!cancelled && o) setOrder(o);
    };
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    const poll = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [activeOrderId]);

  useEffect(() => {
    if (!activeOrderId || !order || order.status === "served" || order.status === "completed") {
      return;
    }
    const timer = setInterval(async () => {
      const updated = await api.advanceVenueOrderStatus(activeOrderId);
      if (updated) setOrder(updated);
    }, ADVANCE_MS);
    return () => clearInterval(timer);
  }, [activeOrderId, order?.status]);

  if (!activeOrderId) return null;

  if (loading && !order) {
    return (
      <div className="px-4 pt-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) return null;

  const canAddMore = !["served", "completed", "cancelled"].includes(order.status);

  return (
    <div className="px-4 pt-4">
      <Card className="border-brand/20 bg-gradient-to-br from-brand-tint/80 to-surface">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-base">Order {order.reference}</CardTitle>
            <OrderStatusPill status={order.status} dot={false} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(order.total)} · {order.items.length} item
            {order.items.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <VenueTimeline status={order.status} />
          {order.status !== "served" && order.status !== "completed" && (
            <p className="text-center text-[11px] text-muted-foreground">
              Status updates automatically
            </p>
          )}
          {canAddMore && (
            <Button variant="outline" className="w-full" onClick={() => setCartOpen(true)}>
              <Plus className="size-4" />
              Add more items
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
