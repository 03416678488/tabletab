import type { Branch, Order } from "@/lib/types";

export function orderTableLabel(order: Order, branch: Branch): string {
  if (order.tableId) {
    const table = branch.tables.find((t) => t.id === order.tableId);
    if (table) return `Table ${table.label}`;
  }
  const short = branch.name;
  return `${short} · ${order.fulfillmentType}`;
}
