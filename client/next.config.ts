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
};

export default nextConfig;
