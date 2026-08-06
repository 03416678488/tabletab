import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  AuthRequestError,
  login,
  logout,
  refresh,
} from "@/features/auth/services/auth.service";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";

/** Refresh the access token slightly before it actually expires. */
const EXPIRY_SKEW_MS = 30_000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: AUTH_ROUTES.login,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const data = await login({ email, password });
          // Shape returned here becomes `user` in the jwt callback.
          return {
            id: data.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roleNames: Object.keys(data.roles ?? {}),
            roles: data.roles ?? {},
            tokens: data.tokens,
          };
        } catch (err) {
          // 401 => bad credentials: return null so NextAuth reports CredentialsSignin.
          if (err instanceof AuthRequestError && err.statusCode === 401) {
            return null;
          }
          // Anything else (network/5xx/misconfig) bubbles up as a real error.
          throw err;
        }
      },
    }),
  ],
  events: {
    /** Revoke the refresh session server-side so the tokens die with the cookie. */
    async signOut(message) {
      const token = "token" in message ? message.token : undefined;
      if (token?.refreshToken) {
        try {
          await logout(token.refreshToken);
        } catch {
          // Best-effort: the session cookie is cleared regardless, and the
          // server-side family expires on its own TTL.
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // 1) Initial sign-in: seed the token from the authorize() result.
      if (user) {
        const u = user as typeof user & {
          firstName: string;
          lastName: string;
          roleNames: string[];
          roles: Record<string, Record<string, string[]>>;
          tokens: {
            token: string;
            refreshToken: string;
            tokenExpiresAt: string;
            refreshTokenExpiresAt: string;
          };
        };
        token.accessToken = u.tokens.token;
        token.refreshToken = u.tokens.refreshToken;
        token.accessTokenExpires = new Date(u.tokens.tokenExpiresAt).getTime();
        token.refreshTokenExpires = new Date(
          u.tokens.refreshTokenExpiresAt,
        ).getTime();
        token.user = {
          id: u.id as string,
          email: u.email as string,
          firstName: u.firstName,
          lastName: u.lastName,
          roleNames: u.roleNames,
          roles: u.roles,
        };
        delete token.error;
        return token;
      }

      // 2) Access token still valid → reuse it.
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - EXPIRY_SKEW_MS
      ) {
        return token;
      }

      // 3) Refresh token itself expired → force re-login.
      if (
        token.refreshTokenExpires &&
        Date.now() >= token.refreshTokenExpires
      ) {
        token.error = "RefreshTokenExpired";
        return token;
      }

      // 4) Try to rotate the access token.
      if (!token.refreshToken) {
        token.error = "RefreshAccessTokenError";
        return token;
      }
      try {
        const { tokens } = await refresh(token.refreshToken);
        token.accessToken = tokens.token;
        token.refreshToken = tokens.refreshToken;
        token.accessTokenExpires = new Date(tokens.tokenExpiresAt).getTime();
        token.refreshTokenExpires = new Date(
          tokens.refreshTokenExpiresAt,
        ).getTime();
        delete token.error;
      } catch {
        token.error = "RefreshAccessTokenError";
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user,
          name: `${token.user.firstName} ${token.user.lastName}`.trim(),
        };
      }
      return session;
    },
  },
});
