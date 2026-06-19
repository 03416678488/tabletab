/**
 * lib/api.ts — the SINGLE SWAP POINT.
 *
 * Every data read/write in the app goes through this module. Today it returns
 * typed mock data with simulated latency; later, each function body can be
 * replaced with a real fetch() to a backend without touching any UI code.
 */
import { getBuffetSnapshot } from "@/hooks/use-buffet-store";
import { getMenuSnapshot } from "@/hooks/use-menu-store";
import { getSettingsSnapshot } from "@/hooks/use-settings-store";
import { getStaffSnapshot } from "@/hooks/use-staff-store";
import {
  customerAccount as initialCustomerAccount,
  getBranchOnlineConfig,
  orders as initialOrders,
  getOwnerAnalytics,
  salesLast7Days,
  serviceRequests,
} from "@/lib/mock";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import {
  availableTablesForBooking,
  createPreOrderForReservation,
  createReservationRecord,
  dismissReservationTask,
  getReservation,
  listReservationTasks,
  listReservations,
  patchReservation,
  reservationStatsForToday,
  tickReservationTimers,
} from "@/lib/reservations-logic";
import { orderItemsSubtotal, isBuffetAvailable } from "@/lib/buffet-utils";
import { cartTax, cartTotal } from "@/lib/cart-utils";
import type {
  Address,
  AnalyticsPeriod,
  Branch,
  BranchReservationSettings,
  BuffetPackage,
  BuffetSelection,
  CreateOrderInput,
  CreateReservationInput,
  CreateVenueOrderInput,
  CustomerAccount,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OwnerAnalytics,
  Reservation,
  ReservationTask,
  SalesPoint,
  ServiceRequest,
  ServiceRequestType,
  StaffUser,
  Table,
  TenantBranding,
  TenantSettings,
} from "@/lib/types";
import { resolveBranding } from "@/lib/theme";
import { getSlaWindowMs } from "@/lib/utils";

function dineInTotals(items: OrderItem[], buffet?: BuffetSelection) {
  const subtotal = orderItemsSubtotal(items) + (buffet?.subtotal ?? 0);
  const tax = cartTax(subtotal);
  return { subtotal, tax, total: cartTotal(subtotal, 0, tax) };
}

function delay<T>(data: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredCloneSafe(data)), ms));
}

/** structuredClone with a JSON fallback for older runtimes. */
function structuredCloneSafe<T>(data: T): T {
  if (typeof structuredClone === "function") return structuredClone(data);
  return JSON.parse(JSON.stringify(data));
}

let mutableOrders: Order[] = structuredCloneSafe(initialOrders);
let mutableServiceRequests: ServiceRequest[] = structuredCloneSafe(serviceRequests);
let mutableCustomer: CustomerAccount = structuredCloneSafe(initialCustomerAccount);
let orderCounter = mutableOrders.length + 1000;
let serviceRequestCounter = mutableServiceRequests.length + 1;

const KITCHEN_ACTIVE: OrderStatus[] = ["placed", "accepted", "preparing", "ready"];

function applySlaBreaches() {
  const now = Date.now();
  mutableOrders = mutableOrders.map((o) => {
    if (o.status !== "placed" || o.acceptedAt) return o;
    const elapsed = now - new Date(o.placedAt).getTime();
    if (elapsed >= getSlaWindowMs()) return { ...o, slaBreached: true };
    return o;
  });
}

function patchOrder(orderId: string, patch: Partial<Order>): Order | undefined {
  const idx = mutableOrders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;
  const updated = { ...mutableOrders[idx], ...patch };
  mutableOrders = [...mutableOrders.slice(0, idx), updated, ...mutableOrders.slice(idx + 1)];
  return updated;
}

const SIM_MENU = [
  { id: "itm-bruschetta", name: "Heirloom Bruschetta", price: 9.5 },
  { id: "itm-margherita", name: "Margherita", price: 15 },
  { id: "itm-salmon", name: "Miso Glazed Salmon", price: 26 },
  { id: "itm-burger", name: "Olive & Ash Burger", price: 18 },
  { id: "itm-calamari", name: "Crispy Calamari", price: 12.5 },
];

const SIM_TABLES = ["br-riverside-t1", "br-riverside-t2", "br-riverside-t4", "br-riverside-p2"];

const DELIVERY_STATUS_FLOW: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out-for-delivery",
  "completed",
];

const PICKUP_STATUS_FLOW: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "completed",
];

const VENUE_STATUS_FLOW: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "served",
];

function nextStatus(order: Order): OrderStatus | null {
  const flow =
    order.fulfillmentType === "delivery" ? DELIVERY_STATUS_FLOW : PICKUP_STATUS_FLOW;
  const idx = flow.indexOf(order.status);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function branchRef(branchId: string) {
  return branchId === "br-riverside" ? "RV" : "UP";
}

export const api = {
  // Tenant
  getTenant: () => delay<TenantSettings>(getSettingsSnapshot().tenant),
  getTenantBranding: () =>
    delay<TenantBranding>(resolveBranding(getSettingsSnapshot().tenant.branding)),

  // Branches & tables
  getBranches: () => delay<Branch[]>(getSettingsSnapshot().branches),
  getBranch: (branchId: string) =>
    delay<Branch | undefined>(getSettingsSnapshot().branches.find((b) => b.id === branchId)),
  getBranchOnlineConfig: (branchId: string) => {
    const branch = getSettingsSnapshot().branches.find((b) => b.id === branchId);
    const fallback = getBranchOnlineConfig(branchId);
    const config: BranchOnlineConfig = {
      ...fallback,
      deliveryAvailable: branch?.onlineOrderingEnabled ?? fallback.deliveryAvailable,
      deliveryFee: branch?.deliveryFee ?? fallback.deliveryFee,
      pickupAvailable: branch?.onlineOrderingEnabled !== false ? fallback.pickupAvailable : false,
    };
    return delay<BranchOnlineConfig>(config);
  },
  getTables: (branchId: string) =>
    delay<Table[]>(
      getSettingsSnapshot().branches.find((b) => b.id === branchId)?.tables ?? [],
    ),
  resolveTableToken: (token: string) => {
    for (const b of getSettingsSnapshot().branches) {
      const table = b.tables.find((t) => t.qrToken === token);
      if (table) return delay<{ branch: Branch; table: Table } | null>({ branch: b, table });
    }
    return delay<{ branch: Branch; table: Table } | null>(null);
  },

  // Menu
  getCategories: () => {
    const { categories } = getMenuSnapshot();
    return delay<MenuCategory[]>([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
  },
  getMenuItems: (categoryId?: string) => {
    const { items } = getMenuSnapshot();
    const list = categoryId ? items.filter((m) => m.categoryId === categoryId) : items;
    return delay<MenuItem[]>(list);
  },
  getMenuItem: (itemId: string) => {
    const { items } = getMenuSnapshot();
    return delay<MenuItem | undefined>(items.find((m) => m.id === itemId));
  },

  // Orders
  getOrders: (branchId?: string) => {
    applySlaBreaches();
    const list = branchId
      ? mutableOrders.filter((o) => o.branchId === branchId)
      : mutableOrders;
    return delay<Order[]>(list);
  },
  getKitchenOrders: (branchId: string) => {
    applySlaBreaches();
    tickReservationTimers();
    const now = Date.now();
    const list = mutableOrders.filter((o) => {
      if (o.branchId !== branchId || !KITCHEN_ACTIVE.includes(o.status)) return false;
      if (o.fireAt && new Date(o.fireAt).getTime() > now) return false;
      return true;
    });
    return delay<Order[]>(list);
  },
  getScheduledKitchenOrders: (branchId: string) => {
    tickReservationTimers();
    const now = Date.now();
    const list = mutableOrders.filter(
      (o) =>
        o.branchId === branchId &&
        o.fireAt &&
        new Date(o.fireAt).getTime() > now &&
        KITCHEN_ACTIVE.includes(o.status),
    );
    return delay<Order[]>(list);
  },
  getOrder: (orderId: string) =>
    delay<Order | undefined>(mutableOrders.find((o) => o.id === orderId)),
  getCustomerOrders: (customerId: string) =>
    delay<Order[]>(
      mutableOrders
        .filter((o) => o.customerId === customerId && o.channel === "online")
        .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()),
    ),
  createVenueOrder: (input: CreateVenueOrderInput) => {
    if (!input.items.length && !input.buffet) {
      throw new Error("Order must include buffet covers or menu items");
    }
    orderCounter += 1;
    const ref = `${branchRef(input.branchId)}-${orderCounter}`;
    const totals = dineInTotals(input.items, input.buffet);
    const order: Order = {
      id: `ord-${orderCounter}`,
      reference: ref,
      channel: "in-venue",
      fulfillmentType: "dine-in",
      branchId: input.branchId,
      tableId: input.tableId,
      status: "placed",
      items: input.items,
      buffet: input.buffet,
      customerName: input.customerName,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      placedAt: new Date().toISOString(),
    };
    mutableOrders = [order, ...mutableOrders];
    return delay<Order>(order, 500);
  },

  getTableActiveOrder: (tableId: string) => {
    const order = mutableOrders.find(
      (o) =>
        o.tableId === tableId &&
        o.channel === "in-venue" &&
        !["served", "completed", "cancelled"].includes(o.status),
    );
    return delay<Order | undefined>(order);
  },

  advanceVenueOrderStatus: (orderId: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const idx = VENUE_STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= VENUE_STATUS_FLOW.length - 1) {
      return delay<Order>(order);
    }
    const next = VENUE_STATUS_FLOW[idx + 1];
    const now = new Date().toISOString();
    const updated = patchOrder(orderId, {
      status: next,
      acceptedAt: next !== "placed" && !order.acceptedAt ? now : order.acceptedAt,
      readyAt: next === "ready" || next === "served" ? order.readyAt ?? now : order.readyAt,
      completedAt: next === "served" ? now : order.completedAt,
    });
    return delay<Order | undefined>(updated, 200);
  },

  placeVenueServiceRequest: (
    branchId: string,
    tableId: string,
    tableLabel: string,
    type: ServiceRequestType,
    note?: string,
  ) => {
    serviceRequestCounter += 1;
    const req: ServiceRequest = {
      id: `sr-${serviceRequestCounter}`,
      branchId,
      tableId,
      tableLabel,
      type,
      note,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    mutableServiceRequests = [req, ...mutableServiceRequests];
    return delay<ServiceRequest>(req, 300);
  },

  createOrder: (input: CreateOrderInput) => {
    orderCounter += 1;
    const ref = `${branchRef(input.branchId)}-${orderCounter}`;
    const order: Order = {
      id: `ord-${orderCounter}`,
      reference: ref,
      channel: "online",
      fulfillmentType: input.fulfillmentType,
      branchId: input.branchId,
      status: "placed",
      items: input.items,
      customerName: input.customerName,
      customerId: input.customerId,
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      tax: input.tax,
      total: input.total,
      placedAt: new Date().toISOString(),
      deliveryAddressId: input.deliveryAddressId,
      pickupTime: input.pickupTime,
    };
    mutableOrders = [order, ...mutableOrders];
    return delay<Order>(order, 500);
  },
  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const now = new Date().toISOString();
    const updated = patchOrder(orderId, {
      status,
      acceptedAt:
        status !== "placed" && !order.acceptedAt ? now : order.acceptedAt,
      readyAt:
        status === "ready" || status === "served" || status === "out-for-delivery"
          ? order.readyAt ?? now
          : order.readyAt,
      completedAt: status === "completed" ? now : order.completedAt,
      slaBreached: status !== "placed" ? false : order.slaBreached,
    });
    return delay<Order | undefined>(updated, 150);
  },

  acknowledgeOrder: (orderId: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order || !["placed", "accepted"].includes(order.status)) {
      return delay<Order | undefined>(undefined);
    }
    const now = new Date().toISOString();
    const updated = patchOrder(orderId, {
      status: "preparing",
      acceptedAt: order.acceptedAt ?? now,
      slaBreached: false,
    });
    return delay<Order | undefined>(updated, 150);
  },

  markOrderReady: (orderId: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order || order.status !== "preparing") {
      return delay<Order | undefined>(undefined);
    }
    const now = new Date().toISOString();
    const updated = patchOrder(orderId, { status: "ready", readyAt: now });
    return delay<Order | undefined>(updated, 150);
  },

  serveOrder: (orderId: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order || order.status !== "ready") {
      return delay<Order | undefined>(undefined);
    }
    const updated = patchOrder(orderId, { status: "served" });
    return delay<Order | undefined>(updated, 150);
  },

  addItemsToOrder: (orderId: string, items: OrderItem[]) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const merged = [...order.items, ...items];
    const totals = dineInTotals(merged, order.buffet);
    const updated = patchOrder(orderId, {
      items: merged,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
    });
    return delay<Order | undefined>(updated, 200);
  },

  attachBuffetToOrder: (orderId: string, buffet: BuffetSelection) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const totals = dineInTotals(order.items, buffet);
    const updated = patchOrder(orderId, {
      buffet,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
    });
    return delay<Order | undefined>(updated, 200);
  },

  advanceOrderStatus: (orderId: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const next = nextStatus(order);
    if (!next) return delay<Order>(order);
    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      status: next,
      acceptedAt: next !== "placed" && !order.acceptedAt ? now : order.acceptedAt,
      readyAt:
        next === "ready" || next === "out-for-delivery" || next === "completed"
          ? order.readyAt ?? now
          : order.readyAt,
      completedAt: next === "completed" ? now : order.completedAt,
    };
    mutableOrders = mutableOrders.map((o) => (o.id === orderId ? updated : o));
    return delay<Order>(updated, 200);
  },

  // Service requests
  getServiceRequests: (branchId?: string) => {
    const list = branchId
      ? mutableServiceRequests.filter((s) => s.branchId === branchId)
      : mutableServiceRequests;
    return delay<ServiceRequest[]>(list);
  },

  resolveServiceRequest: (requestId: string) => {
    const idx = mutableServiceRequests.findIndex((s) => s.id === requestId);
    if (idx < 0) return delay<ServiceRequest | undefined>(undefined);
    const updated = { ...mutableServiceRequests[idx], resolved: true };
    mutableServiceRequests = [
      ...mutableServiceRequests.slice(0, idx),
      updated,
      ...mutableServiceRequests.slice(idx + 1),
    ];
    return delay<ServiceRequest>(updated, 150);
  },

  /** Demo: inject a new in-venue order for the kitchen/waiter boards. */
  simulateIncomingOrder: (branchId: string) => {
    orderCounter += 1;
    const ref = `${branchRef(branchId)}-${orderCounter}`;
    const item = SIM_MENU[orderCounter % SIM_MENU.length];
    const tableId = SIM_TABLES[orderCounter % SIM_TABLES.length];
    const branch = getSettingsSnapshot().branches.find((b) => b.id === branchId);
    const table = branch?.tables.find((t) => t.id === tableId);
    const order: Order = {
      id: `ord-${orderCounter}`,
      reference: ref,
      channel: orderCounter % 3 === 0 ? "online" : "in-venue",
      fulfillmentType: orderCounter % 3 === 0 ? "pickup" : "dine-in",
      branchId,
      tableId: orderCounter % 3 === 0 ? undefined : tableId,
      status: "placed",
      customerName: table ? `Table ${table.label}` : "Online pickup",
      items: [
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1 + (orderCounter % 2),
          unitPrice: item.price,
          modifiers: [],
          notes: orderCounter % 4 === 0 ? "Allergy: nuts" : undefined,
        },
      ],
      subtotal: item.price,
      total: item.price,
      placedAt: new Date().toISOString(),
    };
    mutableOrders = [order, ...mutableOrders];
    return delay<Order>(order, 100);
  },

  simulateServiceRequest: (branchId: string, type: ServiceRequestType = "waiter") => {
    serviceRequestCounter += 1;
    const branch = getSettingsSnapshot().branches.find((b) => b.id === branchId);
    const seated = branch?.tables.filter((t) => t.status === "seated" || t.status === "needs-service") ?? [];
    const table = seated[serviceRequestCounter % seated.length] ?? branch?.tables[0];
    if (!table) return delay<ServiceRequest | null>(null, 100);
    const req: ServiceRequest = {
      id: `sr-${serviceRequestCounter}`,
      branchId,
      tableId: table.id,
      tableLabel: table.label,
      type,
      note: type === "waiter" ? "Guest needs assistance" : undefined,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    mutableServiceRequests = [req, ...mutableServiceRequests];
    return delay<ServiceRequest>(req, 100);
  },

  // Staff & customer
  getStaff: () => delay<StaffUser[]>(getStaffSnapshot().staff),
  getCurrentStaff: () => {
    const { staff } = getStaffSnapshot();
    return delay<StaffUser>(staff[0]);
  },
  getCustomerAccount: () => delay<CustomerAccount>(mutableCustomer),

  loginCustomer: (email: string, _password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !_password) return delay<null>(null, 400);
    if (normalized !== mutableCustomer.email.toLowerCase()) {
      mutableCustomer = { ...mutableCustomer, email: normalized };
    }
    return delay<CustomerAccount>(mutableCustomer, 400);
  },

  signupCustomer: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    mutableCustomer = {
      id: `cu-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      addresses: [],
    };
    return delay<CustomerAccount>(mutableCustomer, 500);
  },

  updateCustomerProfile: (data: { name: string; phone: string }) => {
    mutableCustomer = {
      ...mutableCustomer,
      name: data.name.trim(),
      phone: data.phone.trim(),
    };
    return delay<CustomerAccount>(mutableCustomer);
  },

  addAddress: (address: Omit<Address, "id">) => {
    const id = `addr-${Date.now()}`;
    let addresses = [...mutableCustomer.addresses];
    if (address.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }
    addresses.push({ ...address, id });
    mutableCustomer = { ...mutableCustomer, addresses };
    return delay<CustomerAccount>(mutableCustomer);
  },

  updateAddress: (addressId: string, patch: Partial<Omit<Address, "id">>) => {
    let addresses = mutableCustomer.addresses.map((a) =>
      a.id === addressId ? { ...a, ...patch } : a,
    );
    if (patch.isDefault) {
      addresses = addresses.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      }));
    }
    mutableCustomer = { ...mutableCustomer, addresses };
    return delay<CustomerAccount>(mutableCustomer);
  },

  deleteAddress: (addressId: string) => {
    const addresses = mutableCustomer.addresses.filter((a) => a.id !== addressId);
    mutableCustomer = { ...mutableCustomer, addresses };
    return delay<CustomerAccount>(mutableCustomer);
  },

  // Manager actions
  cancelOrder: (orderId: string, reason: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const updated = patchOrder(orderId, {
      status: "cancelled",
      managerNote: reason.trim(),
      completedAt: new Date().toISOString(),
    });
    return delay<Order | undefined>(updated, 200);
  },

  overrideOrder: (orderId: string, status: OrderStatus, reason: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const now = new Date().toISOString();
    const updated = patchOrder(orderId, {
      status,
      managerNote: reason.trim(),
      acceptedAt: status !== "placed" && !order.acceptedAt ? now : order.acceptedAt,
      readyAt:
        ["ready", "served", "out-for-delivery", "completed"].includes(status)
          ? order.readyAt ?? now
          : order.readyAt,
      slaBreached: false,
    });
    return delay<Order | undefined>(updated, 200);
  },

  reassignOrder: (orderId: string, staffId: string, reason: string) => {
    const order = mutableOrders.find((o) => o.id === orderId);
    if (!order) return delay<Order | undefined>(undefined);
    const updated = patchOrder(orderId, {
      assignedToStaffId: staffId,
      managerNote: reason.trim(),
    });
    return delay<Order | undefined>(updated, 200);
  },

  // Analytics
  getSalesLast7Days: () => delay<SalesPoint[]>(salesLast7Days),
  getOwnerAnalytics: (period: AnalyticsPeriod = "day") =>
    delay<OwnerAnalytics>(getOwnerAnalytics(period), 400),

  // Reservations
  getReservationSettings: (branchId: string) =>
    delay<BranchReservationSettings>(getSettingsSnapshot().getReservationSettings(branchId)),
  updateReservationSettings: (
    branchId: string,
    patch: Partial<Omit<BranchReservationSettings, "branchId">>,
  ) => {
    getSettingsSnapshot().updateReservationSettings(branchId, patch);
    return delay<BranchReservationSettings>(
      getSettingsSnapshot().getReservationSettings(branchId),
    );
  },
  getReservations: (branchId?: string) => {
    tickReservationTimers();
    return delay<Reservation[]>(listReservations(branchId));
  },
  getReservation: (id: string) => {
    tickReservationTimers();
    return delay<Reservation | undefined>(getReservation(id));
  },
  getReservationTasks: (branchId?: string) => {
    tickReservationTimers();
    return delay<ReservationTask[]>(listReservationTasks(branchId));
  },
  getAvailableReservationTables: (
    branchId: string,
    partySize: number,
    date: string,
    time: string,
  ) => {
    const branch = getSettingsSnapshot().getBranch(branchId);
    if (!branch) return delay<Table[]>([]);
    return delay<Table[]>(availableTablesForBooking(branch, partySize, date, time));
  },
  createReservation: async (input: CreateReservationInput) => {
    try {
      const r = createReservationRecord(input);
      return delay<Reservation>(r, 500);
    } catch (e) {
      throw e;
    }
  },
  confirmReservation: (reservationId: string, staffId: string) => {
    const r = getReservation(reservationId);
    if (!r || r.status !== "requested") return delay<Reservation | undefined>(undefined);
    const now = new Date().toISOString();
    let updated = patchReservation(reservationId, {
      status: "confirmed",
      confirmedAt: now,
      confirmedBy: staffId,
    });
    if (updated?.preOrder?.length || updated?.buffet) {
      updated = createPreOrderForReservation(updated, (order) => {
        orderCounter += 1;
        mutableOrders = [order, ...mutableOrders];
      });
    }
    for (const t of listReservationTasks(r.branchId).filter((x) => x.reservationId === r.id)) {
      dismissReservationTask(t.id);
    }
    return delay<Reservation | undefined>(updated, 200);
  },
  seatReservation: (reservationId: string) => {
    const r = getReservation(reservationId);
    if (!r || r.status !== "confirmed") return delay<Reservation | undefined>(undefined);
    const updated = patchReservation(reservationId, {
      status: "seated",
      seatedAt: new Date().toISOString(),
    });
    return delay<Reservation | undefined>(updated, 150);
  },
  completeReservation: (reservationId: string) => {
    const r = getReservation(reservationId);
    if (!r || !["seated", "confirmed"].includes(r.status)) {
      return delay<Reservation | undefined>(undefined);
    }
    const updated = patchReservation(reservationId, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
    return delay<Reservation | undefined>(updated, 150);
  },
  markReservationNoShow: (reservationId: string) => {
    const updated = patchReservation(reservationId, {
      status: "no-show",
      completedAt: new Date().toISOString(),
    });
    return delay<Reservation | undefined>(updated, 150);
  },
  cancelReservation: (reservationId: string) => {
    const updated = patchReservation(reservationId, {
      status: "cancelled",
      completedAt: new Date().toISOString(),
    });
    return delay<Reservation | undefined>(updated, 150);
  },
  dismissReservationTask: (taskId: string) =>
    delay<ReservationTask | undefined>(dismissReservationTask(taskId), 100),
  runReservationTimers: () => {
    tickReservationTimers();
    return delay<void>(undefined as void, 0);
  },
  getReservationStats: (branchId?: string) =>
    delay(reservationStatsForToday(branchId)),

  // Buffet packages
  getBuffetPackages: (branchId?: string, at?: string) => {
    const list = getBuffetSnapshot().packages.filter((p) => {
      if (!p.isActive) return false;
      if (branchId && p.branchId && p.branchId !== branchId) return false;
      return true;
    });
    if (at) {
      const when = new Date(at);
      return delay(list.filter((p) => isBuffetAvailable(p, when)));
    }
    return delay<BuffetPackage[]>(list);
  },
  getBuffetPackage: (id: string) =>
    delay<BuffetPackage | undefined>(getBuffetSnapshot().getPackage(id)),
  upsertBuffetPackage: (pkg: BuffetPackage) => {
    getBuffetSnapshot().upsertPackage(pkg);
    return delay<BuffetPackage>(pkg, 150);
  },
  deleteBuffetPackage: (id: string) => {
    getBuffetSnapshot().removePackage(id);
    return delay<void>(undefined as void, 100);
  },
};

export type Api = typeof api;
