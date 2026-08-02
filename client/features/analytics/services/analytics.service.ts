import { httpClient } from "@/lib/httpClient";
import type {
  Analytics,
  AnalyticsInput,
} from "@/features/analytics/types/analytics.types";

export const analyticsService = {
  list() {
    return httpClient.get<Analytics[]>("/analytics").then((r) => r.data);
  },
  create(body: AnalyticsInput) {
    return httpClient
      .post<Analytics>("/analytics", body, { auth: true })
      .then((r) => r.data);
  },
  update(id: number, body: Partial<AnalyticsInput>) {
    return httpClient
      .put<Analytics>(`/analytics/${id}`, body, { auth: true })
      .then((r) => r.data);
  },
  remove(id: number) {
    return httpClient
      .delete<{ message: string }>(`/analytics/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
