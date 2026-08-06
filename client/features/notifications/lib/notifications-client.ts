"use client";

import { notificationService } from "@/features/notifications/services/notification.service";
import type { NotificationPriority } from "@/features/notifications/types/notification.types";

/**
 * Cross-component notification signalling + attention preferences.
 *
 * Boards live in a different component tree than the bell, so when a board
 * auto-reads a category we broadcast a window event the bell hook listens for —
 * the badge updates instantly without a shared store.
 */
export const NOTIF_CHANGED_EVENT = "notifications:changed";

export function broadcastNotificationsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIF_CHANGED_EVENT));
  }
}

/** Mark a category read on the server, then refresh every mounted bell. */
export async function markCategoryReadLive(category: string): Promise<void> {
  try {
    await notificationService.markCategoryRead(category);
    broadcastNotificationsChanged();
  } catch {
    // Best-effort — a failed auto-read just leaves the badge as-is.
  }
}

// ── Preferences ─────────────────────────────────────────────────────────────
// All client-side (localStorage). Gates the chime + toast only — the badge
// always updates so nothing is lost. `critical` always breaks through.

const PREFS_KEY = "tabletap.notifications.prefs";

export interface NotificationPrefs {
  /** Do Not Disturb — silences everything but critical. */
  dnd: boolean;
  /** "HH:MM" quiet-hours window (local time); null disables. */
  quietFrom: string | null;
  quietTo: string | null;
  /** Categories whose chime/toast are muted (badge still updates). */
  mutedCategories: string[];
}

const DEFAULT_PREFS: NotificationPrefs = {
  dnd: false,
  quietFrom: null,
  quietTo: null,
  mutedCategories: [],
};

export function getPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as NotificationPrefs) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function setPrefs(patch: Partial<NotificationPrefs>): void {
  if (typeof window === "undefined") return;
  const next = { ...getPrefs(), ...patch };
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  broadcastNotificationsChanged();
}

/** Back-compat helpers for the bell's quick DND toggle. */
export const isDnd = (): boolean => getPrefs().dnd;
export const setDnd = (on: boolean): void => setPrefs({ dnd: on });

function withinQuietHours(from: string | null, to: string | null): boolean {
  if (!from || !to) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const f = fh * 60 + fm;
  const t = th * 60 + tm;
  if (f === t) return false;
  return f < t ? cur >= f && cur < t : cur >= f || cur < t; // wraps midnight
}

/**
 * Whether an arrival should escalate to a chime + toast. Only high/critical ever
 * alert; critical always does. Otherwise DND, quiet hours, and per-category mute
 * suppress it (the badge still updates regardless).
 */
export function shouldAlert(priority: NotificationPriority, category: string): boolean {
  if (priority !== "high" && priority !== "critical") return false;
  if (priority === "critical") return true;
  const prefs = getPrefs();
  if (prefs.dnd) return false;
  if (prefs.mutedCategories.includes(category)) return false;
  if (withinQuietHours(prefs.quietFrom, prefs.quietTo)) return false;
  return true;
}
