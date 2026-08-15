export type ReportGranularity = "day" | "week" | "month";

export interface ReportTotals {
  salesTotal: number;
  ordersCount: number;
  avgOrder: number;
  subtotalTotal: number;
  discountTotal: number;
  taxTotal: number;
  reservationTotal: number;
  reservationCount: number;
  eventTotal: number;
  eventCount: number;
  netProfit: number;
}

export interface SalesReport {
  from: string;
  to: string;
  granularity: ReportGranularity;
  totals: ReportTotals;
  /** Same-length window before `from` — for period-over-period deltas. */
  previous: ReportTotals;
  byType: { type: string; count: number; total: number }[];
  byMethod: { method: string; count: number; total: number }[];
  byDay: { day: string; count: number; total: number }[];
  byBranch: { branchId: string; branchName: string; count: number; total: number }[];
  byHour: { hour: number; count: number; total: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
}
