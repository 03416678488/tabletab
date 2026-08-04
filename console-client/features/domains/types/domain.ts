export type DomainKind = "storefront" | "admin";
export type DomainStatus = "pending" | "verified" | "failed";

export interface TenantDomain {
  id: string;
  tenantId: string;
  hostname: string;
  kind: DomainKind;
  verificationToken: string;
  status: DomainStatus;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  /** The exact DNS record the customer must publish to prove ownership. */
  dns: { recordType: "TXT"; name: string; value: string };
}
