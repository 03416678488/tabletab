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
  cancellationReason: string | null;
  branchId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  customerLat: number | null;
  customerLng: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
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
  /** Pinned coords of the delivery address (for the tracking map). */
  deliveryLat?: number;
  deliveryLng?: number;
  /** Payment method chosen at checkout. */
  paymentMethod?: string;
  /** Whether the order has been paid (dine-in pays at the table). */
  paymentStatus?: "paid" | "unpaid";
  /** Contact phone captured at checkout. */
  customerPhone?: string;
  /** Name of the branch the order was placed at. */
  branchName?: string;
  /** Branch's delivery ETA in minutes (delivery orders). */
  deliveryEtaMinutes?: number;
  /** The customer's own note for the order (kitchen instructions). */
  note?: string;
  /** True for a QR dine-in ("table") order. */
  isDineIn?: boolean;
  /** Table name for dine-in orders (e.g. "T2-MH"). */
  tableName?: string;
  /** Why the order was cancelled (shown on the tracking page). */
  cancellationReason?: string;
}

/** Backend statuses map onto the storefront's status vocabulary. */
export const STATUS_MAP: Record<string, OrderStatus> = {
  placed: "placed",
  confirmed: "accepted",
  preparing: "preparing",
  ready: "ready",
  "out-for-delivery": "out-for-delivery",
  served: "served",
  delivered: "delivered",
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
    .filter((l) => l && !/^Pickup at /i.test(l) && !/^Dine-in · Table/i.test(l))
    .join("\n")
    .trim();
  return rest || undefined;
}

/** Pull the table name out of the checkout's `Dine-in · Table <name>` marker. */
function parseTableName(notes: string | null): string | undefined {
  const line = notes
    ?.split(/\\n|\r?\n/)
    .map((l) => l.trim())
    .find((l) => /^Dine-in · Table/i.test(l));
  return line?.replace(/^Dine-in · Table/i, "").trim() || undefined;
}

function toOrder(o: ApiOrder): StorefrontOrder {
  const isDineIn = o.orderType === "table";
  const isDelivery = !isDineIn && Boolean(o.customerAddress);
  return {
    id: o.id,
    reference: o.orderNumber,
    channel: "online",
    // The backend stores only orderType; a captured address means delivery.
    fulfillmentType: isDelivery ? "delivery" : "pickup",
    isDineIn,
    tableName: parseTableName(o.notes),
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
    deliveryLat: o.customerLat ?? undefined,
    deliveryLng: o.customerLng ?? undefined,
    paymentMethod: o.paymentMethod ?? undefined,
    paymentStatus: o.paymentStatus === "paid" ? "paid" : "unpaid",
    branchName: o.branch?.name ?? undefined,
    deliveryEtaMinutes: o.branch?.deliveryEtaMinutes ?? undefined,
    note: parseCustomerNote(o.notes),
    cancellationReason: o.cancellationReason ?? undefined,
  };
}

export interface PlaceOrderInput {
  branchId: string;
  /** "online" for delivery/pickup (default); "table" for a QR dine-in order. */
  orderType?: "online" | "table";
  /** Required for dine-in — the scanned table. */
  tableId?: string;
  fulfillmentType?: "delivery" | "pickup";
  items: CartItem[];
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  /** Exact pinned coords of the delivery address (for the tracking map). */
  customerLat?: number;
  customerLng?: number;
  /** Chosen payment method label (e.g. "Stripe", "Cash on Delivery"). */
  paymentMethod?: string;
  /** A promo code — re-validated + applied server-side (authoritative). */
  promotionCode?: string;
  /** 'paid' when charged at checkout (card/wallet); 'unpaid' for COD / dine-in. */
  paymentStatus?: "paid" | "unpaid";
  tax: number;
  deliveryFee: number;
  notes?: string;
}

/** Map a cart line to the API item shape. The API item has no modifier field,
 *  so fold the chosen options into the name (kitchen/receipt still see them) and
 *  the unit price. The server re-prices guest items from the menu regardless —
 *  the price sent here is only a hint. */
function toApiItem(i: CartItem) {
  const mods = i.modifiers.reduce((s, m) => s + m.priceDelta, 0);
  const modLabels = i.modifiers.map((m) => m.label).join(", ");
  return {
    menuItemId: i.menuItemId,
    name: modLabels ? `${i.name} (${modLabels})` : i.name,
    unitPrice: i.unitPrice + mods,
    quantity: i.quantity,
    notes: i.notes,
  };
}

/** Place a real order (online or dine-in). The API computes subtotal/total + number. */
export async function placeStorefrontOrder(input: PlaceOrderInput): Promise<StorefrontOrder> {
  const res = await httpClient.post<ApiOrder>("/orders", {
    orderType: input.orderType ?? "online",
    branchId: input.branchId,
    tableId: input.tableId,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    customerLat: input.customerLat,
    customerLng: input.customerLng,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    promotionCode: input.promotionCode,
    notes: input.notes,
    tax: input.tax,
    deliveryFee: input.deliveryFee,
    items: input.items.map(toApiItem),
  });
  return toOrder(res.data);
}

export interface PlaceDineInInput {
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  notes?: string;
  promotionCode?: string;
  /** Per-submit key so a double-tap / retry doesn't create a second order. */
  idempotencyKey?: string;
}

/**
 * Place a dine-in order through the QR slug. The table + branch are derived
 * server-side from the slug (never sent by the client) and every item is
 * re-priced against the live menu — the secure guest ordering path.
 */
export async function placeDineInOrder(
  slug: string,
  input: PlaceDineInInput,
): Promise<StorefrontOrder> {
  const res = await httpClient.post<ApiOrder>(`/qr-codes/${slug}/orders`, {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    notes: input.notes,
    promotionCode: input.promotionCode,
    idempotencyKey: input.idempotencyKey,
    items: input.items.map(toApiItem),
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

/** A signed-in customer's order history (newest first). */
export async function fetchCustomerOrders(customerId: string): Promise<StorefrontOrder[]> {
  const res = await httpClient.get<{ items?: ApiOrder[] } | ApiOrder[]>(
    `/orders/customer/${customerId}`,
  );
  const list = Array.isArray(res.data) ? res.data : (res.data.items ?? []);
  return list.map(toOrder);
}
