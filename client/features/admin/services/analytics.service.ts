import { httpClient } from "@/lib/httpClient";
import type { AnalyticsPeriod, OwnerAnalytics } from "@/lib/types";

/**
 * Owner dashboard analytics, aggregated from the tenant's real orders by the API
 * (GET /dashboard/analytics). Shape matches OwnerAnalytics exactly.
 */
export const analyticsService = {
  getOwnerAnalytics: (period: AnalyticsPeriod, branchId?: string) =>
    httpClient
      .get<OwnerAnalytics>(`/dashboard/analytics`, {
        auth: true,
        params: { period, branchId: branchId || undefined },
      })
      .then((r) => r.data),
};
