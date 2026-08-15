"use client";

import { useEffect, useMemo } from "react";

import { useOrders } from "@/features/order/hooks/use-orders";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import type { Order } from "@/features/order/types/order.types";

/** A delivery order is an online order with a delivery address. */
export function isDelivery(o: Order): boolean {
  return o.orderType === "online" && Boolean(o.customerAddress);
}

/**
 * Delivery orders bucketed for the rider's dashboard + board. Backed by the
 * cached online-orders list with light polling so both screens stay in sync.
 * Follows the topbar branch switcher — "All branches" shows every branch.
 */
export function useDeliveryQueue() {
  const branchId = useScopedBranchId();
  const { orders, loading, refetch } = useOrders({
    orderType: "online",
    ...(branchId ? { branchId } : {}),
  });

  // Keep the queue fresh without a dedicated stream.
  useEffect(() => {
    const t = setInterval(() => void refetch(), 15000);
    return () => clearInterval(t);
  }, [refetch]);

  const buckets = useMemo(() => {
    const deliveries = orders.filter(isDelivery);
    const deliveredAll = deliveries.filter((o) => o.status === "delivered");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const today = deliveredAll.filter(
      (o) => new Date(o.updatedAt).getTime() >= startOfDay.getTime(),
    );
    return {
      ready: deliveries.filter((o) => o.status === "ready"),
      outForDelivery: deliveries.filter((o) => o.status === "out-for-delivery"),
      deliveredToday: today.length,
      collectedToday: today.reduce((s, o) => s + o.total, 0),
      recentDelivered: [...deliveredAll]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 8),
    };
  }, [orders]);

  return { ...buckets, loading, refetch };
}
