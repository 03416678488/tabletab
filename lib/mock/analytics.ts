import type {
  AnalyticsPeriod,
  BestSeller,
  BranchSplit,
  ChannelSplit,
  OwnerAnalytics,
  OwnerKpis,
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
    role: "owner",
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
  };
}

export { salesByDay };
