import { httpClient } from "@/lib/httpClient";
import type { SalesReport } from "@/features/report/types/report.types";

export const reportService = {
  sales(from?: string, to?: string, branchId?: string, granularity?: string) {
    return httpClient
      .get<SalesReport>("/reports/sales", {
        auth: true,
        params: { from, to, branchId, granularity },
      })
      .then((r) => r.data);
  },
};
