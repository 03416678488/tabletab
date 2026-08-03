import { FormattedRoles } from './types';

/** The tenant a token is bound to. Absent for platform/global (tenant-less) tokens. */
export interface TenantClaim {
  id: string;
  slug: string;
}

export interface AuthJwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: FormattedRoles;
  /** Tenant this token was minted for — enforced by the TenantBindingGuard. */
  tenant?: TenantClaim | null;
}
