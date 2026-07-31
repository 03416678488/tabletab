/** Base URL for table QR links ({appUrl}/t/{qrToken}). */
export function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function tableQrUrl(qrToken: string): string {
  return `${getAppUrl()}/t/${qrToken}`;
}
