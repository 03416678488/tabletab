import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import { mapApiRolesToStaffRole } from "@/lib/roles";
import {
  LOCALE_COOKIE,
  detectLocale,
  splitLocalePath,
  withLocale,
} from "@/features/i18n/config";

/**
 * Route protection for the staff/admin dashboard + public custom-page routing,
 * plus app-wide locale routing (`/<lang>-<region>/...`, e.g. /en-ae/checkout).
 *
 * NOTE: In this Next.js version the `middleware` convention is renamed to
 * `proxy` (see node_modules/next/dist/docs/.../proxy.md). We wrap NextAuth's
 * `auth` helper, which populates `req.auth` with the decoded session.
 *
 * Locale strategy: every URL carries a locale prefix. A request WITHOUT one is
 * redirected to a detected locale (saved cookie → Accept-Language + geo country
 * header → default). A request WITH one is internally rewritten onto the real
 * (unprefixed) route the app actually has, so the visible URL stays localized
 * while Next serves the underlying page. All auth redirects keep the prefix.
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
  "favorites",
  "checkout",
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

const COOKIE_OPTS = { path: "/", maxAge: 31_536_000, sameSite: "lax" as const };

export default auth((req) => {
  const { nextUrl } = req;
  const { locale: urlLocale, rest } = splitLocalePath(nextUrl.pathname);

  // (A) No locale prefix → detect one and redirect to the localized URL.
  if (!urlLocale) {
    const locale = detectLocale({
      preferred: req.cookies.get(LOCALE_COOKIE)?.value,
      acceptLanguage: req.headers.get("accept-language"),
      // Geo country from the CDN/host when present (absent on localhost).
      country: req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry"),
    });
    const url = nextUrl.clone();
    url.pathname = withLocale(locale, nextUrl.pathname);
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, locale, COOKIE_OPTS);
    return res;
  }

  const locale = urlLocale;
  const segments = rest.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  const isLoggedIn = !!req.auth;

  // Serve the underlying (unprefixed) route while keeping the visible URL.
  const rewriteTo = (internalPath: string) => {
    const url = nextUrl.clone();
    url.pathname = internalPath;
    const res = NextResponse.rewrite(url);
    res.cookies.set(LOCALE_COOKIE, locale, COOKIE_OPTS);
    return res;
  };
  // Redirect that preserves the locale prefix on the visible URL.
  const redirectTo = (target: string, search = "") => {
    const url = nextUrl.clone();
    url.pathname = withLocale(locale, target);
    url.search = search;
    return NextResponse.redirect(url);
  };

  // 1) Custom website page — a single, non-reserved segment renders publicly at
  //    /p/<slug> (a bare /:slug route would clash with the dashboard /[role]).
  if (segments.length === 1 && !RESERVED_SEGMENTS.has(first) && !first.includes(".")) {
    return rewriteTo(`/p/${first}`);
  }

  // 2) Login page — bounce signed-in users to their dashboard.
  if (rest === AUTH_ROUTES.login) {
    if (isLoggedIn) {
      const role = mapApiRolesToStaffRole(req.auth?.user?.roleNames ?? []);
      return redirectTo(`/${role}/dashboard`);
    }
    return rewriteTo(rest);
  }

  // 3) Dashboard/print routes require a session; storefront routes stay public.
  if (PROTECTED_SEGMENTS.has(first) && !isLoggedIn) {
    return redirectTo(
      AUTH_ROUTES.login,
      `?callbackUrl=${encodeURIComponent(nextUrl.pathname + nextUrl.search)}`,
    );
  }

  // Default: serve the underlying route.
  return rewriteTo(rest);
});

export const config = {
  // Run on every navigable route so the locale prefix is enforced everywhere.
  // Excludes the API, Next internals, and any path with a file extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\..*).*)"],
};
