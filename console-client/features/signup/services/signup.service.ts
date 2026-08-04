import { httpClient } from "@/lib/httpClient";
import type { Tenant } from "@/features/tenants/types/tenant";
import type { SignupForm } from "@/features/signup/schemas/signup";

export interface SignupResult {
  tenant: Tenant;
  subdomain: string;
  storefrontUrl: string;
  adminUrl: string;
  owner: { email: string };
}

/** Public self-serve signup — no auth. Provisions a tenant and its first admin. */
export const signupService = {
  create: (input: SignupForm) =>
    httpClient.post<SignupResult>(`/signup`, input).then((r) => r.data),
};
