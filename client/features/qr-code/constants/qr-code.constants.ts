import { getAppUrl } from "@/lib/app-url";

export const QR_CODE_ENDPOINTS = {
  base: "/qr-codes",
  byId: (id: string) => `/qr-codes/${id}`,
} as const;

/** Build the public scan URL a QR code encodes: {appUrl}/t/{slug}.
 *  Uses the configured public app URL (NEXT_PUBLIC_APP_URL) when set so the
 *  code is reachable from a guest's phone — not the admin's localhost/LAN. */
export function scanUrlForSlug(slug: string): string {
  return `${getAppUrl()}/t/${slug}`;
}
