import type { Branch, Order } from "@/lib/types";

export function orderTableLabel(order: Order, branch: Branch): string {
  if (order.tableId) {
    const table = branch.tables.find((t) => t.id === order.tableId);
    if (table) return `Table ${table.label}`;
  }
  const short = branch.name.replace("Olive & Ash — ", "");
  return `${short} · ${order.fulfillmentType}`;
}

export function kitchenColumn(order: Order): "new" | "preparing" | "ready" {
  if (order.status === "ready") return "ready";
  if (order.status === "preparing") return "preparing";
  return "new";
}

export function sortKitchenOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const aKey = a.acceptedAt ?? a.placedAt;
    const bKey = b.acceptedAt ?? b.placedAt;
    return new Date(aKey).getTime() - new Date(bKey).getTime();
  });
}
