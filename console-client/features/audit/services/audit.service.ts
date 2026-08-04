import { httpClient } from "@/lib/httpClient";
import type { AuditLog } from "@/features/audit/types/audit";

export const auditService = {
  list: (params?: { action?: string; targetId?: string; limit?: number }) =>
    httpClient
      .get<AuditLog[]>(`/audit-logs`, { auth: true, params })
      .then((r) => r.data),
};
