import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";

/**
 * Route protection for the platform console.
 *
 * NOTE: In this Next.js version the `middleware` convention is renamed to
 * `proxy` (see node_modules/next/dist/docs/.../proxy.md). We wrap NextAuth's
 * `auth` helper, which populates `req.auth` with the decoded session.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Login page — bounce signed-in platform admins straight to the console.
  if (nextUrl.pathname === AUTH_ROUTES.login) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/tenants", nextUrl));
    return NextResponse.next();
  }

  // Everything else the matcher covers is console UI — require a session.
  if (!isLoggedIn) {
    const loginUrl = new URL(AUTH_ROUTES.login, nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/tenants/:path*"],
};
