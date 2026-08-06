/**
 * TableTap service worker — offline app shell for the POS.
 *
 * Runtime caching only (no precache manifest, so it survives Next's hashed
 * chunk names): pages you visit + their static assets get cached, so a full
 * reload while offline still loads the app. API calls are NEVER cached — they
 * hit the network and fail cleanly, which the POS offline queue handles.
 */
const VERSION = "v1";
const STATIC_CACHE = `tabletap-static-${VERSION}`;
const PAGES_CACHE = `tabletap-pages-${VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // cross-origin: passthrough
  if (url.pathname.startsWith("/api")) return; // API: always network, never cache

  // Page loads (full reload / first paint): network-first, fall back to cache.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cache = await caches.open(PAGES_CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match(url.pathname)) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Immutable static assets + fonts/images: cache-first.
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    /\.(?:js|css|woff2?|png|svg|jpe?g|gif|webp|ico)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
  }
  // Everything else (RSC payloads, etc.): default network behaviour.
});
