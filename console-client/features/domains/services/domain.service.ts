import { httpClient } from "@/lib/httpClient";
import type { DomainKind, TenantDomain } from "@/features/domains/types/domain";

/** Custom-domain workflow against the console (control-plane) API. */
export const domainService = {
  list: (tenantId: string) =>
    httpClient
      .get<TenantDomain[]>(`/tenants/${tenantId}/domains`, { auth: true })
      .then((r) => r.data),

  add: (tenantId: string, input: { hostname: string; kind: DomainKind }) =>
    httpClient
      .post<TenantDomain>(`/tenants/${tenantId}/domains`, input, { auth: true })
      .then((r) => r.data),

  /** Run the DNS TXT check now; returns the domain with its updated status. */
  verify: (id: string) =>
    httpClient
      .post<TenantDomain>(`/domains/${id}/verify`, undefined, { auth: true })
      .then((r) => r.data),

  remove: (id: string) =>
    httpClient
      .delete<{ message: string }>(`/domains/${id}`, { auth: true })
      .then((r) => r.data),
};
