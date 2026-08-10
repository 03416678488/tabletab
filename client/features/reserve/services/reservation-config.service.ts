import { settingsService } from "@/features/app-settings/services/settings.service";

/**
 * Tenant-wide reservation config, sourced from **Settings → Reservation Time**
 * (the `reservation` settings group). Drives the storefront booking flow: slot
 * window, turn time, party limit, booking window, notice, and table hold.
 */
export interface ReservationConfig {
  enabled: boolean;
  /** Booking window opens/closes each day — "HH:mm" (24h). */
  openTime: string;
  closeTime: string;
  /** How long a booking holds a table (turn time). */
  slotDurationMins: number;
  maxPartySize: number;
  /** How many days ahead guests can book. */
  bookingWindowDays: number;
  /** Minimum lead time before a slot, in minutes. */
  minNoticeMins: number;
  /** Table hold / no-show grace, in minutes. */
  holdMins: number;
}

const posInt = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export async function fetchReservationConfig(): Promise<ReservationConfig> {
  const groups = await settingsService.getPublic();
  const r = groups.reservation ?? {};

  const noticeHours = Number(r.min_notice_hours);
  const minNoticeMins = (Number.isFinite(noticeHours) && noticeHours >= 0 ? noticeHours : 1) * 60;

  return {
    // Unconfigured or "enable" → on; only an explicit "disable" turns it off.
    enabled: r.enabled !== "disable",
    openTime: r.open_time || "11:00",
    closeTime: r.close_time || "22:00",
    slotDurationMins: posInt(r.slot_duration, 90),
    maxPartySize: posInt(r.max_party_size, 12),
    bookingWindowDays: posInt(r.advance_days, 14),
    minNoticeMins,
    holdMins: posInt(r.hold_minutes, 15),
  };
}
