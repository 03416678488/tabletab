import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import { mapApiRolesToStaffRole } from "@/lib/roles";

/**
 * Route protection for the staff/admin dashboard.
 *
 * NOTE: In this Next.js version the `middleware` convention is renamed to
 * `proxy` (see node_modules/next/dist/docs/.../proxy.md). We wrap NextAuth's
 * `auth` helper, which populates `req.auth` with the decoded session.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isLoginPage = nextUrl.pathname === AUTH_ROUTES.login;

  // Already signed in but sitting on the login page → send to their dashboard.
  if (isLoginPage) {
    if (isLoggedIn) {
      const role = mapApiRolesToStaffRole(req.auth?.user?.roleNames ?? []);
      return NextResponse.redirect(new URL(`/${role}/dashboard`, nextUrl));
    }
    return NextResponse.next();
  }

  // Any matched dashboard route requires a session.
  if (!isLoggedIn) {
    const loginUrl = new URL(AUTH_ROUTES.login, nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Guard the dashboard's root-level routes + the login page. The public
  // storefront (/, /account, /checkout, /order, /signup) and NextAuth's own
  // /api/auth endpoints are intentionally excluded.
  matcher: [
    "/login",
    // role-prefixed dashboard: /{role}/{feature}
    "/admin/:path*",
    "/manager/:path*",
    "/chef/:path*",
    "/waiter/:path*",
    // print QR route (admin-only) lives outside the role prefix
    "/branches/:path*",
  ],
};
