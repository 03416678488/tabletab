import { transactionService } from "@/features/transaction/services/transaction.service";
import type {
  ListTransactionsParams,
  Transaction,
} from "@/features/transaction/types/transaction.types";

/** Escape a value for CSV (quote when it contains comma / quote / newline). */
function cell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const TYPE_LABEL: Record<string, string> = {
  sale: "Sale",
  refund: "Refund",
  cash_in: "Cash In",
  cash_out: "Cash Out",
  reservation_deposit: "Reservation Deposit",
  event_payment: "Event Payment",
};
const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mfs: "MFS",
  other: "Other",
};

function waiterOf(t: Transaction): string {
  const w = t.order?.assignedWaiter;
  return [w?.firstName, w?.lastName].filter(Boolean).join(" ").trim();
}

/**
 * Fetch every transaction matching the current filter (not just the visible
 * page) and download it as CSV. Pure client-side — no export endpoint.
 */
export async function exportTransactionsCsv(
  filters: Omit<ListTransactionsParams, "page" | "perPage">,
): Promise<void> {
  const data = await transactionService.list({ ...filters, page: 1, perPage: 1000 });
  const rows: (string | number)[][] = [];

  rows.push(["Type", "Method", "Order", "Waiter", "Note", "Time", "Amount"]);
  data.items.forEach((t) => {
    rows.push([
      TYPE_LABEL[t.type] ?? t.type,
      METHOD_LABEL[t.method] ?? t.method,
      t.order?.orderNumber ?? "",
      waiterOf(t),
      t.note ?? "",
      new Date(t.createdAt).toISOString(),
      t.amount,
    ]);
  });

  const csv = rows.map((r) => r.map(cell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
