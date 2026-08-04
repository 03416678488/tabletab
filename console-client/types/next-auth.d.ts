import type { FormattedRoles } from "@/features/auth/types/auth.types";

interface SessionUserFields {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleNames: string[];
  roles: FormattedRoles;
}

declare module "next-auth" {
  interface Session {
    /** Bearer access token consumed by lib/httpClient. */
    accessToken?: string;
    /** Set when the refresh cycle fails; UI can force a re-login. */
    error?: string;
    user: SessionUserFields & { name?: string | null; image?: string | null };
  }

  /** Object returned from Credentials.authorize(). */
  interface User {
    firstName?: string;
    lastName?: string;
    roleNames?: string[];
    roles?: FormattedRoles;
    tokens?: {
      token: string;
      refreshToken: string;
      tokenExpiresAt: string;
      refreshTokenExpiresAt: string;
    };
  }
}

// next-auth/jwt only re-exports @auth/core/jwt, so we augment the source module.
declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    error?: string;
    user?: SessionUserFields;
  }
}
