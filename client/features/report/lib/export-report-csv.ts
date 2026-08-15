import type { SalesReport } from "@/features/report/types/report.types";

/** Escape a value for CSV (quote when it contains comma / quote / newline). */
function cell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const TYPE_LABEL: Record<string, string> = { pos: "POS", online: "Online", table: "Table" };
const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mfs: "MFS",
  other: "Other",
};

/**
 * Build a CSV of the whole report (KPIs vs previous period, time series, and
 * every breakdown) and trigger a download. Pure client-side — no endpoint.
 */
export function exportReportCsv(report: SalesReport): void {
  const rows: (string | number)[][] = [];
  const t = report.totals;
  const p = report.previous;

  rows.push(["TableTap sales report"]);
  rows.push(["From", report.from, "To", report.to, "Granularity", report.granularity]);
  rows.push([]);

  rows.push(["Metric", "Current", "Previous"]);
  rows.push(["Sales", t.salesTotal, p.salesTotal]);
  rows.push(["Orders", t.ordersCount, p.ordersCount]);
  rows.push(["Avg order", t.avgOrder, p.avgOrder]);
  rows.push(["Discount", t.discountTotal, ""]);
  rows.push(["Tax", t.taxTotal, ""]);
  rows.push(["Reservation deposits", t.reservationTotal, p.reservationTotal]);
  rows.push(["Event payments", t.eventTotal, p.eventTotal]);
  rows.push(["Total earnings", t.netProfit, p.netProfit]);
  rows.push([]);

  rows.push(["Revenue over time", "Period", "Orders", "Revenue"]);
  report.byDay.forEach((d) => rows.push(["", d.day, d.count, d.total]));
  rows.push([]);

  rows.push(["By branch", "Branch", "Orders", "Revenue"]);
  report.byBranch.forEach((b) => rows.push(["", b.branchName, b.count, b.total]));
  rows.push([]);

  rows.push(["By hour", "Hour", "Orders", "Revenue"]);
  report.byHour.forEach((h) =>
    rows.push(["", `${String(h.hour).padStart(2, "0")}:00`, h.count, h.total]),
  );
  rows.push([]);

  rows.push(["By order type", "Type", "Orders", "Revenue"]);
  report.byType.forEach((x) => rows.push(["", TYPE_LABEL[x.type] ?? x.type, x.count, x.total]));
  rows.push([]);

  rows.push(["By payment method", "Method", "Count", "Total"]);
  report.byMethod.forEach((x) =>
    rows.push(["", METHOD_LABEL[x.method] ?? x.method, x.count, x.total]),
  );
  rows.push([]);

  rows.push(["Top items", "Item", "Qty sold", "Revenue"]);
  report.topItems.forEach((x) => rows.push(["", x.name, x.qty, x.revenue]));

  const csv = rows.map((r) => r.map(cell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${report.from.slice(0, 10)}_${report.to.slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
