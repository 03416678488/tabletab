import { httpClient } from "@/lib/httpClient";
import type { SalesReport } from "@/features/report/types/report.types";

export const reportService = {
  sales(from?: string, to?: string) {
    return httpClient
      .get<SalesReport>("/reports/sales", { auth: true, params: { from, to } })
      .then((r) => r.data);
  },
};
