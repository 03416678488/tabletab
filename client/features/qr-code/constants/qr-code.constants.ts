export const QR_CODE_ENDPOINTS = {
  base: "/qr-codes",
  byId: (id: string) => `/qr-codes/${id}`,
} as const;

/** Build the public scan URL a QR code encodes: {origin}/t/{slug}. */
export function scanUrlForSlug(slug: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/t/${slug}`;
}
