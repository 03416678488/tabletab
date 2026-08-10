import { httpClient } from "@/lib/httpClient";
import type { OwnerAnalytics } from "@/lib/types";

/**
 * Owner dashboard analytics, aggregated from the tenant's real orders by the API
 * (GET /dashboard/analytics). Pass a custom `from`/`to` range (YYYY-MM-DD); the
 * series auto-buckets by span. Shape matches OwnerAnalytics exactly.
 */
export const analyticsService = {
  getOwnerAnalytics: (range: { from: string; to: string }, branchId?: string) =>
    httpClient
      .get<OwnerAnalytics>(`/dashboard/analytics`, {
        auth: true,
        params: { from: range.from, to: range.to, branchId: branchId || undefined },
      })
      .then((r) => r.data),
};
