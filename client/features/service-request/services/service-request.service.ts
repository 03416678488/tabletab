import { httpClient } from "@/lib/httpClient";
import type { ServiceRequest } from "@/lib/types";

interface ApiServiceRequest {
  id: string;
  type: "waiter" | "bill";
  status: "open" | "resolved";
  tableId: string | null;
  tableName: string | null;
  branchId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/** Map the API row to the board's ServiceRequest shape. */
function toClient(r: ApiServiceRequest): ServiceRequest {
  return {
    id: r.id,
    branchId: r.branchId ?? "",
    tableId: r.tableId ?? "",
    tableLabel: r.tableName ?? "Table",
    type: r.type,
    createdAt: r.createdAt,
    resolved: r.status === "resolved",
  };
}

export const serviceRequestService = {
  listOpen: () =>
    httpClient
      .get<ApiServiceRequest[]>("/service-requests", { auth: true })
      .then((r) => (r.data ?? []).map(toClient)),

  resolve: (id: string) =>
    httpClient
      .post<unknown>(`/service-requests/${id}/resolve`, undefined, { auth: true })
      .then(() => undefined),
};
