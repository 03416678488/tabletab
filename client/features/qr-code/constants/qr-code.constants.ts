import { getAppUrl } from "@/lib/app-url";
import type { QrCode } from "@/features/qr-code/types/qr-code.types";

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

/** The exact string a code encodes: table codes point at /t/{slug}; custom
 *  codes encode their raw `content` (a URL, WiFi payload, phone, text…). */
export function qrEncodedValue(qr: QrCode): string {
  if (qr.kind === "custom") return qr.content ?? "";
  return scanUrlForSlug(qr.slug);
}

export interface WifiPayloadInput {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

/** Escape WiFi payload special chars per the `WIFI:` MECARD-style format. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** Build a `WIFI:T:WPA;S:ssid;P:pass;H:false;;` string most phones auto-join. */
export function buildWifiPayload({ ssid, password, encryption, hidden }: WifiPayloadInput): string {
  const parts = [
    `T:${encryption}`,
    `S:${escapeWifi(ssid)}`,
    encryption === "nopass" ? "" : `P:${escapeWifi(password)}`,
    hidden ? "H:true" : "",
  ].filter(Boolean);
  return `WIFI:${parts.join(";")};;`;
}
