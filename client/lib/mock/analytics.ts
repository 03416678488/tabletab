import type {
  AnalyticsPeriod,
  BestSeller,
  BranchSplit,
  CategorySplit,
  ChannelSplit,
  CustomerInsights,
  FulfillmentSplit,
  HeatmapRow,
  OwnerAnalytics,
  OwnerKpis,
  PaymentSplit,
  RevenueTarget,
  SalesPoint,
  StaffPerformanceRow,
} from "@/lib/types";

const salesByDay: SalesPoint[] = [
  { label: "Mon", revenue: 2840, orders: 96 },
  { label: "Tue", revenue: 3120, orders: 104 },
  { label: "Wed", revenue: 2990, orders: 99 },
  { label: "Thu", revenue: 3680, orders: 121 },
  { label: "Fri", revenue: 5240, orders: 168 },
  { label: "Sat", revenue: 6110, orders: 192 },
  { label: "Sun", revenue: 4720, orders: 151 },
];

const salesByMonth: SalesPoint[] = [
  { label: "Jan", revenue: 84200, orders: 2840 },
  { label: "Feb", revenue: 79100, orders: 2650 },
  { label: "Mar", revenue: 92400, orders: 3012 },
  { label: "Apr", revenue: 88700, orders: 2920 },
  { label: "May", revenue: 95600, orders: 3180 },
  { label: "Jun", revenue: 101200, orders: 3345 },
  { label: "Jul", revenue: 108400, orders: 3520 },
  { label: "Aug", revenue: 104800, orders: 3410 },
  { label: "Sep", revenue: 97200, orders: 3198 },
  { label: "Oct", revenue: 112600, orders: 3680 },
  { label: "Nov", revenue: 118900, orders: 3892 },
  { label: "Dec", revenue: 124300, orders: 4015 },
];

const salesByYear: SalesPoint[] = [
  { label: "2023", revenue: 982000, orders: 32400 },
  { label: "2024", revenue: 1148600, orders: 37820 },
  { label: "2025", revenue: 1289400, orders: 42150 },
];

const KPI: OwnerKpis = {
  revenueToday: 4720,
  ordersToday: 151,
  avgOrderValue: 31.26,
  avgKitchenResponseMins: 3.8,
  revenueTrendPct: 12.4,
  ordersTrendPct: 8.2,
  avgOrderTrendPct: 3.9,
  kitchenTrendPct: -6.1, // negative = faster = good (handled in the card)
  revenueSpark: [3680, 2990, 3120, 4110, 3980, 5240, 4720],
  ordersSpark: [121, 99, 104, 133, 128, 168, 151],
  aovSpark: [29.1, 30.2, 29.8, 31.0, 30.6, 31.4, 31.26],
  kitchenSpark: [4.6, 4.3, 4.1, 4.0, 3.9, 3.7, 3.8],
};

// Peak-hours heatmap: orders per hour bucket, per weekday. Restaurant hours
// 10:00–22:00 (13 buckets), weighted to lunch (12–14) and dinner (18–21).
export const HEATMAP_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

const HOURLY_HEATMAP: HeatmapRow[] = [
  { day: "Mon", hours: [2, 5, 14, 18, 9, 4, 3, 6, 15, 22, 19, 11, 4] },
  { day: "Tue", hours: [2, 6, 15, 19, 10, 4, 3, 7, 16, 24, 20, 12, 5] },
  { day: "Wed", hours: [3, 6, 16, 20, 11, 5, 4, 7, 17, 25, 21, 13, 5] },
  { day: "Thu", hours: [3, 7, 18, 22, 12, 5, 4, 8, 20, 28, 24, 15, 6] },
  { day: "Fri", hours: [4, 9, 22, 27, 15, 7, 6, 11, 26, 36, 33, 22, 10] },
  { day: "Sat", hours: [5, 11, 26, 31, 19, 10, 9, 14, 31, 42, 39, 28, 14] },
  { day: "Sun", hours: [5, 10, 24, 29, 17, 8, 7, 12, 27, 35, 30, 19, 8] },
];

const CATEGORY_SPLIT: CategorySplit[] = [
  { category: "Pizza", revenue: 98400, orders: 4120, pct: 31 },
  { category: "Mains", revenue: 76200, orders: 2380, pct: 24 },
  { category: "Burgers", revenue: 54800, orders: 2610, pct: 17 },
  { category: "Starters", revenue: 38900, orders: 3040, pct: 12 },
  { category: "Desserts", revenue: 28600, orders: 2210, pct: 9 },
  { category: "Drinks", revenue: 22100, orders: 3980, pct: 7 },
];

const PAYMENT_SPLIT: PaymentSplit[] = [
  { method: "card", label: "Card", amount: 198400, pct: 62 },
  { method: "cash", label: "Cash", amount: 70400, pct: 22 },
  { method: "wallet", label: "Digital wallet", amount: 41600, pct: 13 },
  { method: "online", label: "Online / gift", amount: 9600, pct: 3 },
];

const FULFILLMENT: FulfillmentSplit[] = [
  { type: "dine-in", label: "Dine-in", orders: 6240, pct: 52 },
  { type: "delivery", label: "Delivery", orders: 3120, pct: 26 },
  { type: "pickup", label: "Pickup", orders: 1680, pct: 14 },
  { type: "qr-table", label: "QR table", orders: 960, pct: 8 },
];

const CUSTOMERS: CustomerInsights = {
  newCount: 348,
  returningCount: 812,
  returningPct: 70,
  avgVisitsPerMonth: 2.4,
  repeatRatePct: 43,
};

// Revenue-to-date vs target, per period.
const TARGETS: Record<AnalyticsPeriod, RevenueTarget> = {
  day: { target: 6000, achieved: 4720 },
  month: { target: 130000, achieved: 104800 },
  year: { target: 1400000, achieved: 1289400 },
};

const BEST_SELLERS: BestSeller[] = [
  { menuItemId: "itm-margherita", name: "Margherita", quantity: 284, revenue: 4260 },
  { menuItemId: "itm-burger", name: "Olive & Ash Burger", quantity: 198, revenue: 3564 },
  { menuItemId: "itm-salmon", name: "Miso Glazed Salmon", quantity: 142, revenue: 3692 },
  { menuItemId: "itm-pepperoni", name: "Spicy Pepperoni", quantity: 176, revenue: 2992 },
  { menuItemId: "itm-burrata", name: "Creamy Burrata", quantity: 124, revenue: 1612 },
];

const CHANNEL_SPLIT: ChannelSplit[] = [
  { channel: "in-venue", label: "Dine-in", revenue: 186400, orders: 6240, pct: 58 },
  { channel: "online", label: "Online", revenue: 134600, orders: 4180, pct: 42 },
];

const BRANCH_SPLIT: BranchSplit[] = [
  { branchId: "br-riverside", name: "Riverside", revenue: 198200, orders: 6520, pct: 62 },
  { branchId: "br-uptown", name: "Uptown", revenue: 122800, orders: 3900, pct: 38 },
];

const STAFF_PERFORMANCE: StaffPerformanceRow[] = [
  {
    staffId: "su-chef",
    name: "Sofia Romano",
    role: "chef",
    avatarUrl: "https://i.pravatar.cc/120?u=tabletap-chef",
    avgAcknowledgeMins: 2.4,
    avgServeMins: 0,
    slaBreaches: 1,
    ordersHandled: 412,
  },
  {
    staffId: "su-waiter",
    name: "Theo Nguyen",
    role: "waiter",
    avatarUrl: "https://i.pravatar.cc/120?u=tabletap-waiter",
    avgAcknowledgeMins: 0,
    avgServeMins: 4.1,
    slaBreaches: 0,
    ordersHandled: 286,
  },
  {
    staffId: "su-manager",
    name: "Marcus Lee",
    role: "manager",
    avatarUrl: "https://i.pravatar.cc/120?u=tabletap-manager",
    avgAcknowledgeMins: 1.8,
    avgServeMins: 0,
    slaBreaches: 0,
    ordersHandled: 94,
  },
  {
    staffId: "su-owner",
    name: "Dana Whitfield",
    role: "admin",
    avatarUrl: "https://i.pravatar.cc/120?u=tabletap-owner",
    avgAcknowledgeMins: 0,
    avgServeMins: 0,
    slaBreaches: 0,
    ordersHandled: 0,
  },
];

const SERIES: Record<AnalyticsPeriod, SalesPoint[]> = {
  day: salesByDay,
  month: salesByMonth,
  year: salesByYear,
};

export function getOwnerAnalytics(period: AnalyticsPeriod = "day"): OwnerAnalytics {
  return {
    kpis: KPI,
    revenueSeries: SERIES[period],
    bestSellers: BEST_SELLERS,
    channelSplit: CHANNEL_SPLIT,
    branchSplit: BRANCH_SPLIT,
    staffPerformance: STAFF_PERFORMANCE.filter((s) => s.ordersHandled > 0),
    hourlyHeatmap: HOURLY_HEATMAP,
    categorySplit: CATEGORY_SPLIT,
    paymentSplit: PAYMENT_SPLIT,
    fulfillment: FULFILLMENT,
    customers: CUSTOMERS,
    target: TARGETS[period],
  };
}

export { salesByDay };
