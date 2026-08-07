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
  // `fallback` runs AFTER dynamic routes, so the client's own catch-all
  // `app/api/auth/[...nextauth]` (NextAuth) handles `/api/auth/*`; only `/api/*`
  // paths with no client route fall through and proxy to the backend.
  async rewrites() {
    const origin = apiOrigin();
    if (!origin) return [];
    return {
      fallback: [{ source: "/api/:path*", destination: `${origin}/api/:path*` }],
    };
  },
   allowedDevOrigins: [
    'ideas-gain-binding-cleaners.trycloudflare.com/',
  ],
};

export default nextConfig;
