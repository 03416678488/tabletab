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
  const res = await httpClient.get<ApiResolvedQr>(`/qr-codes/resolve/${encodeURIComponent(slug)}`);
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
