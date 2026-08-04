export interface SalesReport {
  from: string;
  to: string;
  totals: {
    salesTotal: number;
    ordersCount: number;
    avgOrder: number;
    subtotalTotal: number;
    discountTotal: number;
    taxTotal: number;
    incomeTotal: number;
    expenseTotal: number;
    netProfit: number;
  };
  byType: { type: string; count: number; total: number }[];
  byMethod: { method: string; count: number; total: number }[];
  byDay: { day: string; count: number; total: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
}
