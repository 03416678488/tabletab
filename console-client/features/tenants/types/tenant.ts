export type TenantStatus = "provisioning" | "active" | "suspended";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: string;
  subdomain: string;
  storefrontDomain: string | null;
  adminDomain: string | null;
  dbName: string;
  dbHost: string | null;
  // Billing (Stripe) — null until a subscription is created.
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields the console can edit on a tenant (PUT /tenants/:id). */
export interface UpdateTenantInput {
  name?: string;
  plan?: string;
  storefrontDomain?: string | null;
  adminDomain?: string | null;
}
