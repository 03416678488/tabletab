/** Base URL for table QR links ({appUrl}/t/{qrToken}). */
export function getAppUrl(): string {
  // A configured public URL always wins — a printed/scanned QR must be
  // reachable from a guest's phone, not just from wherever the admin's browser
  // happens to be. `window.location.origin` would bake in localhost or a LAN IP
  // (e.g. 192.168.x.x), which a phone on cellular/Tailscale can't reach, so the
  // guest never lands on /t/{slug} and dine-in is never started.
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function tableQrUrl(qrToken: string): string {
  return `${getAppUrl()}/t/${qrToken}`;
}
