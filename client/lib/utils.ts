import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSettingsSnapshot } from "@/hooks/use-settings-store";
import { formatMoney } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * App-wide money formatter. Delegates to the tenant's configured currency
 * (symbol, position, decimals from Settings → System) so every price in the app
 * reflects the admin's settings. The legacy `currency` arg is ignored — the
 * active currency comes from settings, not the call site.
 */
export function formatCurrency(amount: number, _currency = "USD") {
  return formatMoney(amount);
}

/**
 * Next's image optimizer refuses to fetch localhost/private hosts (SSRF guard),
 * so uploads served by the dev API must be rendered with `next/image`'s
 * `unoptimized` prop. Production hosts optimize normally. Pass an image URL.
 */
export function isLocalUpload(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Live elapsed timer label, e.g. "4:32". */
export function formatElapsed(iso: string, now = Date.now()) {
  const secs = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const SLA_UNACK_MS = 5 * 60 * 1000;

/** SLA window from tenant settings (falls back to 5 min). */
export function getSlaWindowMs(): number {
  const mins = getSettingsSnapshot().tenant.slaWindowMins ?? 5;
  return mins * 60 * 1000;
}

/** True when a placed order has not been acknowledged within the SLA window. */
export function isSlaBreached(order: {
  status: string;
  placedAt: string;
  acceptedAt?: string;
  slaBreached?: boolean;
}) {
  if (order.slaBreached) return true;
  if (order.status !== "placed" || order.acceptedAt) return false;
  return Date.now() - new Date(order.placedAt).getTime() >= getSlaWindowMs();
}

/** Short, human-friendly relative time, e.g. "3m ago". */
export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
