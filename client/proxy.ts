import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";

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

  // Already signed in but sitting on the login page → send to the dashboard.
  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(AUTH_ROUTES.afterLogin, nextUrl));
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
    "/dashboard/:path*",
    "/admin/:path*",
    "/kitchen/:path*",
    "/waiter/:path*",
    "/manager/:path*",
    // exact: the storefront owns the public /menu/[itemId] item pages
    "/menu",
    "/staff/:path*",
    "/settings/:path*",
    "/branches/:path*",
  ],
};
