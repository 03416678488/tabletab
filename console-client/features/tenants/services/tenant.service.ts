import { httpClient } from "@/lib/httpClient";
import type {
  Tenant,
  TenantStatus,
  UpdateTenantInput,
} from "@/features/tenants/types/tenant";

/**
 * Talks to the console (control-plane) API. Point NEXT_PUBLIC_API_BASE_URL at the
 * console-api instance (e.g. http://localhost:3005/api) rather than a tenant API.
 */
export const tenantService = {
  list: () => httpClient.get<Tenant[]>(`/tenants`, { auth: true }).then((r) => r.data),

  get: (id: string) =>
    httpClient.get<Tenant>(`/tenants/${id}`, { auth: true }).then((r) => r.data),

  create: (input: { name: string; slug: string; plan?: string }) =>
    httpClient.post<Tenant>(`/tenants`, input, { auth: true }).then((r) => r.data),

  update: (id: string, input: UpdateTenantInput) =>
    httpClient.put<Tenant>(`/tenants/${id}`, input, { auth: true }).then((r) => r.data),

  setStatus: (id: string, status: TenantStatus) =>
    httpClient
      .put<Tenant>(`/tenants/${id}/status`, { status }, { auth: true })
      .then((r) => r.data),

  /** Re-run provisioning (create the tenant database). */
  provision: (id: string) =>
    httpClient
      .post<Tenant>(`/tenants/${id}/provision`, undefined, { auth: true })
      .then((r) => r.data),

  /** Delete the tenant AND drop its database. `confirm` must equal the slug. */
  remove: (id: string, confirm: string) =>
    httpClient
      .delete<{ message: string }>(`/tenants/${id}`, {
        auth: true,
        params: { confirm },
      })
      .then((r) => r.data),
};
