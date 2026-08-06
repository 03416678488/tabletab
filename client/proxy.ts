import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import { mapApiRolesToStaffRole } from "@/lib/roles";

/**
 * Route protection for the staff/admin dashboard + public custom-page routing.
 *
 * NOTE: In this Next.js version the `middleware` convention is renamed to
 * `proxy` (see node_modules/next/dist/docs/.../proxy.md). We wrap NextAuth's
 * `auth` helper, which populates `req.auth` with the decoded session.
 */

/**
 * Single top-level segments that are NOT custom website pages — dashboard roles,
 * the print route, auth, and the built-in public storefront routes. Anything
 * else that is a single segment (e.g. /about-us) is a custom page slug.
 */
const RESERVED_SEGMENTS = new Set([
  // Dashboard roles (auth-protected)
  "owner",
  "multi_branch_manager",
  "branch_manager",
  "chef",
  "waiter",
  "delivery",
  "branches",
  // Auth
  "login",
  // Built-in public storefront routes
  "order",
  "account",
  "checkout",
  "menu",
  "reserve",
  "signup",
  "track",
  "t",
  "p",
]);

const PROTECTED_SEGMENTS = new Set([
  "owner",
  "multi_branch_manager",
  "branch_manager",
  "chef",
  "waiter",
  "delivery",
  "branches",
]);

export default auth((req) => {
  const { nextUrl } = req;
  const segments = nextUrl.pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";

  // 1) Custom website page — a single, non-reserved segment renders publicly at
  //    /p/<slug> (a bare /:slug route would clash with the dashboard /[role]).
  if (segments.length === 1 && !RESERVED_SEGMENTS.has(first) && !first.includes(".")) {
    const url = nextUrl.clone();
    url.pathname = `/p/${first}`;
    return NextResponse.rewrite(url);
  }

  const isLoggedIn = !!req.auth;

  // 2) Login page — bounce signed-in users to their dashboard.
  if (nextUrl.pathname === AUTH_ROUTES.login) {
    if (isLoggedIn) {
      const role = mapApiRolesToStaffRole(req.auth?.user?.roleNames ?? []);
      return NextResponse.redirect(new URL(`/${role}/dashboard`, nextUrl));
    }
    return NextResponse.next();
  }

  // 3) Dashboard/print routes require a session; storefront routes stay public.
  if (PROTECTED_SEGMENTS.has(first) && !isLoggedIn) {
    const loginUrl = new URL(AUTH_ROUTES.login, nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Dashboard/login/print routes (auth) + single-segment, dot-free paths that
  // may be custom page slugs. `/` and asset requests are intentionally excluded.
  matcher: [
    "/login",
    "/admin/:path*",
    "/manager/:path*",
    "/chef/:path*",
    "/waiter/:path*",
    "/branches/:path*",
    "/:slug([^/.]+)",
  ],
};
