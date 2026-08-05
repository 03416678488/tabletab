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
  "out-for-delivery": { label: "Out for delivery", tone: "blue" },
  served: { label: "Served", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

/**
 * Lifecycle per order type. After the kitchen marks an order `ready`, where it
 * goes next depends on how it's fulfilled:
 *  - table  (dine-in)  → served → completed
 *  - pos    (takeaway) → completed (picked up)
 *  - online (delivery) → out-for-delivery → delivered
 */
export const ORDER_STATUS_FLOW: Record<OrderType, OrderStatus[]> = {
  table: ["placed", "confirmed", "preparing", "ready", "served", "completed"],
  pos: ["placed", "confirmed", "preparing", "ready", "completed"],
  online: ["placed", "confirmed", "preparing", "ready", "out-for-delivery", "delivered"],
};

/** The next status for an order given its type (null = already at the end). */
export function nextStatus(status: OrderStatus, orderType: OrderType): OrderStatus | null {
  const flow = ORDER_STATUS_FLOW[orderType] ?? ORDER_STATUS_FLOW.pos;
  const i = flow.indexOf(status);
  if (i === -1 || i === flow.length - 1) return null;
  return flow[i + 1];
}

export const ORDER_TYPE_META: Record<OrderType, { label: string }> = {
  pos: { label: "POS" },
  online: { label: "Online" },
  table: { label: "Table" },
};
