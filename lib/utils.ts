import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSettingsSnapshot } from "@/hooks/use-settings-store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
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
export function isSlaBreached(order: { status: string; placedAt: string; acceptedAt?: string; slaBreached?: boolean }) {
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
