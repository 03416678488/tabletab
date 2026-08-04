import { httpClient } from "@/lib/httpClient";

export const billingService = {
  /** Start a Stripe Checkout for a tenant's plan; returns the hosted session URL. */
  checkout: (tenantId: string, plan: string) =>
    httpClient
      .post<{ url: string }>(`/billing/checkout`, { tenantId, plan }, { auth: true })
      .then((r) => r.data),
};
