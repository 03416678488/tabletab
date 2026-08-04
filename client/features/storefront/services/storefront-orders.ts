import { httpClient } from "@/lib/httpClient";
import type { CartItem, Order, OrderStatus } from "@/lib/types";

interface ApiOrderItem {
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string | null;
}
interface ApiOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  branchId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  createdAt: string;
  branch: { name: string; deliveryEtaMinutes: number | null } | null;
  items: ApiOrderItem[];
}

/** Storefront order with the extra display fields the tracking page shows. */
export interface StorefrontOrder extends Order {
  /** Free-text delivery address captured at checkout (delivery orders). */
  deliveryAddress?: string;
  /** Contact phone captured at checkout. */
  customerPhone?: string;
  /** Name of the branch the order was placed at. */
  branchName?: string;
  /** Branch's delivery ETA in minutes (delivery orders). */
  deliveryEtaMinutes?: number;
  /** The customer's own note for the order (kitchen instructions). */
  note?: string;
}

/** Backend statuses map onto the storefront's status vocabulary. */
export const STATUS_MAP: Record<string, OrderStatus> = {
  placed: "placed",
  confirmed: "accepted",
  preparing: "preparing",
  ready: "ready",
  served: "served",
  completed: "completed",
  cancelled: "cancelled",
};

/** Map a backend order status to the storefront vocabulary. */
export function mapOrderStatus(status: string): OrderStatus {
  return STATUS_MAP[status] ?? "placed";
}

/**
 * Checkout stores an internal `Pickup at <time>` marker line in the order notes,
 * optionally followed by the customer's own note. These pull each part out.
 */
function parsePickupTime(notes: string | null): string | undefined {
  const line = notes
    ?.split(/\\n|\r?\n/)
    .map((l) => l.trim())
    .find((l) => /^Pickup at /i.test(l));
  return line?.replace(/^Pickup at /i, "").trim() || undefined;
}

function parseCustomerNote(notes: string | null): string | undefined {
  const rest = notes
    ?.split(/\\n|\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^Pickup at /i.test(l))
    .join("\n")
    .trim();
  return rest || undefined;
}

function toOrder(o: ApiOrder): StorefrontOrder {
  const isDelivery = Boolean(o.customerAddress);
  return {
    id: o.id,
    reference: o.orderNumber,
    channel: "online",
    // The backend stores only orderType; a captured address means delivery.
    fulfillmentType: isDelivery ? "delivery" : "pickup",
    branchId: o.branchId ?? "",
    status: STATUS_MAP[o.status] ?? "placed",
    items: o.items.map((i) => ({
      menuItemId: i.menuItemId ?? "",
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      modifiers: [],
      notes: i.notes ?? undefined,
    })),
    customerName: o.customerName ?? "",
    customerPhone: o.customerPhone ?? undefined,
    customerId: o.customerId ?? undefined,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    tax: o.tax,
    total: o.total,
    placedAt: o.createdAt,
    pickupTime: isDelivery ? undefined : parsePickupTime(o.notes),
    deliveryAddress: o.customerAddress ?? undefined,
    branchName: o.branch?.name ?? undefined,
    deliveryEtaMinutes: o.branch?.deliveryEtaMinutes ?? undefined,
    note: parseCustomerNote(o.notes),
  };
}

export interface PlaceOrderInput {
  branchId: string;
  fulfillmentType: "delivery" | "pickup";
  items: CartItem[];
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  tax: number;
  deliveryFee: number;
  notes?: string;
}

/** Place a real online order. The API computes subtotal/total + order number. */
export async function placeStorefrontOrder(input: PlaceOrderInput): Promise<StorefrontOrder> {
  const res = await httpClient.post<ApiOrder>("/orders", {
    orderType: "online",
    branchId: input.branchId,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    notes: input.notes,
    tax: input.tax,
    deliveryFee: input.deliveryFee,
    items: input.items.map((i) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      notes: i.notes,
    })),
  });
  return toOrder(res.data);
}

/** Fetch an order for the tracking page. */
export async function fetchStorefrontOrder(id: string): Promise<StorefrontOrder | null> {
  try {
    const res = await httpClient.get<ApiOrder>(`/orders/${id}`);
    return toOrder(res.data);
  } catch {
    return null;
  }
}
