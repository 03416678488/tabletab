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

/** Extra claims carried only by refresh tokens (rotation + reuse detection). */
export interface RefreshSessionClaims {
  /** Session family id — one per login; stable across rotations. */
  sid: string;
  /** This specific token's id — replaced on every rotation. */
  jti: string;
}
