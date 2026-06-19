/**
 * TableTap core domain types.
 * FRONTEND PHASE: these describe the shape of mock data only. The same types
 * will back a real API later (see lib/api.ts — the single swap point).
 */

export type ID = string;

export type OrderChannel = "in-venue" | "online";
export type FulfillmentType = "dine-in" | "delivery" | "pickup";

export type StaffRole = "owner" | "manager" | "chef" | "waiter";

export type TableStatus = "available" | "seated" | "needs-service" | "inactive";

/** Lifecycle of an order. "out-for-delivery" only applies to delivery orders. */
export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "out-for-delivery"
  | "served"
  | "completed"
  | "cancelled";

export interface Table {
  id: ID;
  branchId: ID;
  label: string;
  floor?: string;
  seats?: number;
  /** Unique, hard-to-guess token encoded into the table QR ({appUrl}/t/{qrToken}). */
  qrToken: string;
  status: TableStatus;
}

export interface Branch {
  id: ID;
  name: string;
  address: string;
  city: string;
  phone: string;
  imageUrl: string;
  isOpen: boolean;
  /** Optional named floors used when laying out tables. */
  floors?: string[];
  tables: Table[];
  openingHours?: string;
  deliveryZone?: string;
  deliveryFee?: number;
  minOrder?: number;
  onlineOrderingEnabled?: boolean;
}

/** Floor plan input when creating tables for a branch. */
export interface FloorPlanInput {
  floorName: string;
  tableCount: number;
  seatsPerTable?: number;
}

export interface TenantBranding {
  /** Base64 data URL from an uploaded logo file. */
  logoDataUrl?: string;
  /** Remote logo URL (used when no upload is set). */
  logoUrl?: string;
  /** Primary brand color (hex). */
  primaryColor: string;
  /** Optional accent color (hex). */
  accentColor?: string;
}

export type MenuDisplayMode = "simple" | "3d";

export interface TenantSettings {
  id: ID;
  name: string;
  tagline: string;
  branding: TenantBranding;
  /** How menu items are shown on customer ordering surfaces. */
  menuDisplayMode: MenuDisplayMode;
  slaWindowMins: number;
  currency: string;
  taxRate: number;
  serviceChargePct: number;
  languages: string[];
}

export interface MenuModifierOption {
  id: ID;
  label: string;
  priceDelta: number;
}

export interface MenuModifierGroup {
  id: ID;
  label: string;
  required: boolean;
  multiple: boolean;
  options: MenuModifierOption[];
}

export type MenuTag =
  | "popular"
  | "new"
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "spicy"
  | "chef-special";

export interface MenuItem {
  id: ID;
  categoryId: ID;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  /** Optional .glb / .gltf URL or data URL — shown in 3D menu display mode. */
  model3dUrl?: string;
  tags: MenuTag[];
  modifiers: MenuModifierGroup[];
  isAvailable: boolean;
}

export interface MenuCategory {
  id: ID;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface CartItemModifier {
  groupId: ID;
  optionId: ID;
  label: string;
  priceDelta: number;
}

export interface CartItem {
  id: ID;
  menuItemId: ID;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  modifiers: CartItemModifier[];
  notes?: string;
}

export interface OrderItem {
  menuItemId: ID;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: CartItemModifier[];
  notes?: string;
}

export type BuffetDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface BuffetTier {
  id: ID;
  label: string;
  price: number;
}

export interface BuffetAddOn {
  id: ID;
  name: string;
  price: number;
}

export interface BuffetAvailability {
  days: BuffetDay[];
  /** HH:mm (24h) service window start */
  startTime: string;
  /** HH:mm (24h) service window end */
  endTime: string;
}

export interface BuffetPackage {
  id: ID;
  /** When omitted, package is available at all branches. */
  branchId?: ID;
  name: string;
  description: string;
  /** Per-head tiers (e.g. Adult / Child). Use when not using flat pricePerPerson. */
  tiers?: BuffetTier[];
  /** Flat per-person price when tiers are not used. */
  pricePerPerson?: number;
  availability: BuffetAvailability;
  addOns?: BuffetAddOn[];
  minGuests?: number;
  maxGuests?: number;
  isActive: boolean;
  imageUrl?: string;
}

export interface BuffetTierSelection {
  tierId: ID;
  label: string;
  count: number;
  unitPrice: number;
}

export interface BuffetAddOnSelection {
  addOnId: ID;
  name: string;
  quantity: number;
  unitPrice: number;
}

/** Covers-based buffet attached to an order or reservation. */
export interface BuffetSelection {
  packageId: ID;
  packageName: string;
  tiers: BuffetTierSelection[];
  addOns: BuffetAddOnSelection[];
  totalCovers: number;
  subtotal: number;
}

export interface Order {
  id: ID;
  reference: string;
  channel: OrderChannel;
  fulfillmentType: FulfillmentType;
  branchId: ID;
  tableId?: ID;
  status: OrderStatus;
  items: OrderItem[];
  /** Covers-based buffet — priced separately from à la carte items. */
  buffet?: BuffetSelection;
  customerName: string;
  customerId?: ID;
  subtotal: number;
  deliveryFee?: number;
  tax?: number;
  total: number;
  placedAt: string;
  acceptedAt?: string;
  readyAt?: string;
  completedAt?: string;
  deliveryAddressId?: ID;
  pickupTime?: string;
  /** When kitchen should start preparing (reservation pre-orders). */
  fireAt?: string;
  /** Linked reservation for dine-in pre-orders. */
  reservationId?: ID;
  /** True once the 5-minute un-started SLA has elapsed and manager was alerted. */
  slaBreached?: boolean;
  /** Manager override / cancel reason (audit trail). */
  managerNote?: string;
  /** Staff member assigned to handle this order (waiter reassignment). */
  assignedToStaffId?: ID;
}

export type AnalyticsPeriod = "day" | "month" | "year";

export interface OwnerKpis {
  revenueToday: number;
  ordersToday: number;
  avgOrderValue: number;
  avgKitchenResponseMins: number;
  revenueTrendPct: number;
  ordersTrendPct: number;
}

export interface BestSeller {
  menuItemId: ID;
  name: string;
  quantity: number;
  revenue: number;
}

export interface ChannelSplit {
  channel: OrderChannel;
  label: string;
  revenue: number;
  orders: number;
  pct: number;
}

export interface BranchSplit {
  branchId: ID;
  name: string;
  revenue: number;
  orders: number;
  pct: number;
}

export interface StaffPerformanceRow {
  staffId: ID;
  name: string;
  role: StaffRole;
  avatarUrl?: string;
  avgAcknowledgeMins: number;
  avgServeMins: number;
  slaBreaches: number;
  ordersHandled: number;
}

export interface OwnerAnalytics {
  kpis: OwnerKpis;
  revenueSeries: SalesPoint[];
  bestSellers: BestSeller[];
  channelSplit: ChannelSplit[];
  branchSplit: BranchSplit[];
  staffPerformance: StaffPerformanceRow[];
}

export interface CreateOrderInput {
  branchId: ID;
  fulfillmentType: "delivery" | "pickup";
  items: OrderItem[];
  customerId: ID;
  customerName: string;
  deliveryAddressId?: ID;
  pickupTime?: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

export interface CreateVenueOrderInput {
  branchId: ID;
  tableId: ID;
  customerName: string;
  items: OrderItem[];
  buffet?: BuffetSelection;
  subtotal: number;
  tax: number;
  total: number;
}

export type ReservationStatus =
  | "requested"
  | "confirmed"
  | "seated"
  | "completed"
  | "no-show"
  | "cancelled";

export type ReservationSource = "online" | "phone" | "walk-in";

export type ReservationTaskType = "reminder" | "urgent-confirm";

export type ReservationTaskStatus = "pending" | "active" | "done" | "dismissed";

export interface BranchReservationSettings {
  branchId: ID;
  enabled: boolean;
  turnTimeMins: number;
  reminderLeadMins: number;
  noShowGraceMins: number;
  bookingWindowDays: number;
  cutoffMins: number;
}

export interface Reservation {
  id: ID;
  branchId: ID;
  tableId: ID;
  partySize: number;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm (24h) slot start */
  time: string;
  durationMins: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  specialRequests?: string;
  preOrder?: OrderItem[];
  buffet?: BuffetSelection;
  preOrderId?: ID;
  status: ReservationStatus;
  source: ReservationSource;
  createdAt: string;
  confirmedBy?: ID;
  confirmedAt?: string;
  seatedAt?: string;
  completedAt?: string;
  /** When kitchen should fire the pre-order (near arrival). */
  fireAt?: string;
}

export interface ReservationTask {
  id: ID;
  reservationId: ID;
  branchId: ID;
  type: ReservationTaskType;
  status: ReservationTaskStatus;
  activatesAt: string;
  createdAt: string;
  message: string;
  guestName: string;
  guestPhone: string;
  slotLabel: string;
}

export interface CreateReservationInput {
  branchId: ID;
  tableId: ID;
  partySize: number;
  date: string;
  time: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  specialRequests?: string;
  preOrder?: OrderItem[];
  buffet?: BuffetSelection;
}

export type ServiceRequestType = "waiter" | "manager" | "bill" | "water";

export interface ServiceRequest {
  id: ID;
  branchId: ID;
  tableId: ID;
  tableLabel: string;
  type: ServiceRequestType;
  note?: string;
  createdAt: string;
  resolved: boolean;
}

export interface StaffUser {
  id: ID;
  name: string;
  email: string;
  role: StaffRole;
  /** Branches this user is assigned to. Owners implicitly see all. */
  branchIds: ID[];
  avatarUrl?: string;
  active?: boolean;
  invitedAt?: string;
}

export interface Address {
  id: ID;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CustomerAccount {
  id: ID;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
}

/** A single point for sales/analytics charts (recharts). */
export interface SalesPoint {
  label: string;
  revenue: number;
  orders: number;
}
