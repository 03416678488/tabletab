import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

/**
 * Allow images served by our own API (uploaded menu/branch photos live under
 * `<API_BASE>/uploads/...`). Derived from the API base URL so it works in dev
 * (http://localhost:3003) and in production without further config.
 */
function apiImagePatterns(): RemotePattern[] {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return [];
  try {
    const u = new URL(base);
    return [
      {
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
      },
    ];
  } catch {
    return [];
  }
}

/** Origin of the backend API (e.g. http://localhost:3003), for proxying /api. */
function apiOrigin(): string | null {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  // The repo root holds a package-lock.json for the shared Husky/lint-staged
  // tooling, so Next sees two lockfiles and guesses the wrong workspace root.
  // Pin tracing to this project. (Drop this if the client moves to its own repo.)
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Production uploads host (from the API base URL). In dev the API is on
      // localhost, which the optimizer refuses to fetch (SSRF guard) — those
      // images are rendered `unoptimized` instead (see `isLocalUpload`).
      ...apiImagePatterns(),
    ],
  },
  async headers() {
    return [
      {
        // Always revalidate the service worker so updates roll out promptly.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },

  // Proxy the backend API through the client so a single origin (localhost, a
  // LAN IP, or one Cloudflare tunnel) serves both the app and its data — the
  // browser calls same-origin `/api/*` and Next forwards it to the API server.
  //
  // `beforeFiles` runs BEFORE any route, so `/api/*` proxies to the backend
  // before the dashboard catch-all `app/(dashboard)/[role]/…` can capture it
  // (`[role]` would otherwise match "api", so /api/branches → /[role=api]/branches).
  // The `(?!auth/)` exclusion lets `/api/auth/*` fall through to the client's own
  // NextAuth route instead of being proxied.
  async rewrites() {
    const origin = apiOrigin();
    if (!origin) return [];
    return {
      beforeFiles: [{ source: "/api/:path((?!auth/).*)", destination: `${origin}/api/:path` }],
    };
  },
  allowedDevOrigins: ["100.93.96.108"],
};

export default nextConfig;
