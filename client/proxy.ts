import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import { isStaffRole, mapApiRolesToStaffRole } from "@/lib/roles";
import { canAccessSlug, homePathForRole, resolveAllowedPath } from "@/lib/permissions";

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
  // Public marketing
  "landing",
  // Built-in public storefront routes
  "order",
  "account",
  "checkout",
  "favorites",
  "menu",
  "reserve",
  "signin",
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

  // API paths are not pages. They now flow through the client (NextAuth at
  // `/api/auth/*`, and the same-origin `/api/* → backend` proxy), so the page
  // middleware must pass them straight through — never treat `api` as a custom
  // page slug or a protected route.
  if (nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const segments = nextUrl.pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";

  // 1) Custom website page — a single, non-reserved segment renders publicly at
  //    /p/<slug> (a bare /:slug route would clash with the dashboard /[role]).
  if (segments.length === 1 && !RESERVED_SEGMENTS.has(first) && !first.includes(".")) {
    const url = nextUrl.clone();
    url.pathname = `/p/${first}`;
    return NextResponse.rewrite(url);
  }

  // A session whose token refresh has failed (refresh token expired, or the
  // refresh call itself errored) still carries a `user`, but its backend access
  // token is dead — every API call 401s. Treat it as logged-out so the user
  // lands on /login and stays there, instead of bouncing between /login and the
  // dashboard forever.
  const isLoggedIn = !!req.auth && !req.auth.error;

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

  // 4) Role authorization — a signed-in staff member may only enter their OWN
  //    role's namespace, and only the pages that role is permitted. This is the
  //    authoritative gate: it stops e.g. a delivery rider reaching the chef KDS
  //    via a stale callbackUrl or a hand-typed `/chef/...` URL, regardless of
  //    what the client renders.
  if (isLoggedIn && isStaffRole(first)) {
    const role = mapApiRolesToStaffRole(req.auth?.user?.roleNames ?? []);
    const slug = segments[1] ?? "dashboard";
    if (first !== role) {
      return NextResponse.redirect(new URL(resolveAllowedPath(role, slug), nextUrl));
    }
    if (!canAccessSlug(role, slug)) {
      return NextResponse.redirect(new URL(homePathForRole(role), nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Dashboard/login routes (auth) + single-segment, dot-free paths that may be
  // custom page slugs. `/` and asset requests are intentionally excluded.
  // NOTE: this list must cover every segment in PROTECTED_SEGMENTS above, or
  // those dashboards render without the middleware session check.
  matcher: [
    "/login",
    "/owner/:path*",
    "/multi_branch_manager/:path*",
    "/branch_manager/:path*",
    "/chef/:path*",
    "/waiter/:path*",
    "/delivery/:path*",
    "/branches/:path*",
    "/:slug([^/.]+)",
  ],
};
