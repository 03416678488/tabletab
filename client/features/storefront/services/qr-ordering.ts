import { httpClient } from "@/lib/httpClient";

interface ApiResolvedQr {
  slug: string;
  isActive: boolean;
  table: {
    id: string;
    name: string;
    branchId: string | null;
    branch: { id: string; name: string } | null;
  };
}

export interface ResolvedQr {
  slug: string;
  tableId: string;
  tableName: string;
  /** May be null if the table isn't assigned a branch — caller falls back. */
  branchId: string | null;
  branchName: string | null;
}

/** Resolve a scanned QR `slug` to its table + branch (public, no auth). */
export async function resolveQrSlug(slug: string): Promise<ResolvedQr> {
  const res = await httpClient.get<ApiResolvedQr>(
    `/qr-codes/resolve/${encodeURIComponent(slug)}`,
  );
  const d = res.data;
  return {
    slug: d.slug,
    tableId: d.table.id,
    tableName: d.table.name,
    branchId: d.table.branchId ?? d.table.branch?.id ?? null,
    branchName: d.table.branch?.name ?? null,
  };
}

/** Call a waiter to the table (public) — alerts branch staff. */
export async function callWaiter(slug: string): Promise<{ message: string }> {
  const res = await httpClient.post<{ message: string }>(
    `/qr-codes/call-waiter/${encodeURIComponent(slug)}`,
  );
  return res.data;
}

export interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** The table's running bill — every active order (round) merged into one session. */
export interface Bill {
  tableId: string;
  tableName: string | null;
  branchId: string | null;
  /** Number of separate orders (rounds) making up this bill. */
  orderCount: number;
  /** Line items merged across all rounds. */
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: "paid" | "unpaid" | "partial";
}

/** The table's running session bill (public), or null when nothing is open. */
export async function getBill(slug: string): Promise<Bill | null> {
  const res = await httpClient.get<Bill | null>(
    `/qr-codes/bill/${encodeURIComponent(slug)}`,
  );
  return res.data ?? null;
}

/** Tell staff the table is ready to pay (public). */
export async function requestBill(slug: string): Promise<{ message: string }> {
  const res = await httpClient.post<{ message: string }>(
    `/qr-codes/request-bill/${encodeURIComponent(slug)}`,
  );
  return res.data;
}
