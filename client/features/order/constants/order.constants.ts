import type { OrderStatus, OrderType } from "@/features/order/types/order.types";

export const ORDER_ENDPOINTS = {
  base: "/orders",
  byId: (id: string) => `/orders/${id}`,
  tableStats: "/orders/table-stats",
  board: "/orders/board",
} as const;

type Tone = "neutral" | "brand" | "amber" | "blue" | "green" | "red" | "purple";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: Tone }
> = {
  placed: { label: "Placed", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "blue" },
  preparing: { label: "Preparing", tone: "purple" },
  ready: { label: "Ready", tone: "brand" },
  served: { label: "Served", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

/** Ordered lifecycle for the "advance status" action (excludes cancelled). */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
];

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUS_FLOW.indexOf(status);
  if (i === -1 || i === ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[i + 1];
}

export const ORDER_TYPE_META: Record<OrderType, { label: string }> = {
  pos: { label: "POS" },
  online: { label: "Online" },
  table: { label: "Table" },
};
