import type { DataSource } from 'typeorm';
import type { Request } from 'express';

export type TenantStatus = 'provisioning' | 'active' | 'suspended';

/** The slice of a control-plane tenant row needed to route a request. */
export interface TenantRecord {
  id: string;
  slug: string;
  dbName: string;
  dbHost: string | null;
  status: TenantStatus;
  /** Subscription plan id (see plans.ts). */
  plan: string | null;
}

/** Express request augmented by the tenant middleware. */
export interface TenantRequest extends Request {
  tenant?: TenantRecord | null;
  tenantDataSource?: DataSource;
}
