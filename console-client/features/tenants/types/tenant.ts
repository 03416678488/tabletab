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
  createdAt: string;
  updatedAt: string;
}
