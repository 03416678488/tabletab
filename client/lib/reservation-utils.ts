import type { Branch, Reservation, ReservationStatus, ReservationTask, Table } from "@/lib/types";

const BLOCKING_STATUSES: ReservationStatus[] = ["requested", "confirmed", "seated"];

export function slotStartDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function slotEndDate(date: string, time: string, durationMins: number): Date {
  const start = slotStartDate(date, time);
  return new Date(start.getTime() + durationMins * 60_000);
}

/** A booking still unconfirmed within this many minutes of arrival is urgent. */
const URGENT_CONFIRM_WINDOW_MINS = 120;

/** Reservations the manager needs to act on now, derived from real bookings:
 *  - `urgent-confirm`: still "requested" and arriving soon → call the guest.
 *  - `reminder`: "confirmed" and within the reminder lead → prep the table.
 *  Past-slot bookings are skipped. Pure — no store, no mock. */
export function deriveReservationTasks(
  reservations: Pick<
    Reservation,
    "id" | "branchId" | "guestName" | "guestPhone" | "date" | "time" | "durationMins" | "status"
  >[],
  reminderLeadMins: number,
): ReservationTask[] {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const out: ReservationTask[] = [];

  for (const r of reservations) {
    const start = slotStartDate(r.date, r.time).getTime();
    const end = slotEndDate(r.date, r.time, r.durationMins).getTime();
    if (now > end) continue; // slot already over
    const minsToStart = Math.round((start - now) / 60_000);

    const base = {
      id: `task-${r.id}`,
      reservationId: r.id,
      branchId: r.branchId,
      status: "active" as const,
      activatesAt: nowIso,
      createdAt: nowIso,
      guestName: r.guestName,
      guestPhone: r.guestPhone,
      slotLabel: formatSlotLabel(r.date, r.time),
    };

    if (r.status === "requested" && minsToStart <= URGENT_CONFIRM_WINDOW_MINS) {
      out.push({
        ...base,
        type: "urgent-confirm",
        message:
          minsToStart >= 0
            ? `Not confirmed — guest arrives in ~${minsToStart} min. Call to confirm.`
            : "Not confirmed and the arrival time has passed. Call the guest.",
      });
    } else if (r.status === "confirmed" && minsToStart <= reminderLeadMins) {
      out.push({
        ...base,
        type: "reminder",
        message:
          minsToStart >= 0
            ? `Arriving in ~${minsToStart} min — have the table ready.`
            : "Guest is due now — greet and seat them.",
      });
    }
  }

  return out.sort((a, b) => a.reservationId.localeCompare(b.reservationId));
}

export function formatSlotLabel(date: string, time: string): string {
  const d = slotStartDate(date, time);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function reservationsOverlap(
  a: Pick<Reservation, "date" | "time" | "durationMins">,
  b: Pick<Reservation, "date" | "time" | "durationMins">,
): boolean {
  const aStart = slotStartDate(a.date, a.time).getTime();
  const aEnd = aStart + a.durationMins * 60_000;
  const bStart = slotStartDate(b.date, b.time).getTime();
  const bEnd = bStart + b.durationMins * 60_000;
  return aStart < bEnd && bStart < aEnd;
}

export function isReservationBlocking(status: ReservationStatus): boolean {
  return BLOCKING_STATUSES.includes(status);
}

export function isTableAvailableForSlot(
  table: Table,
  partySize: number,
  date: string,
  time: string,
  durationMins: number,
  reservations: Reservation[],
  excludeReservationId?: string,
): boolean {
  if (table.status === "inactive") return false;
  const seats = table.seats ?? 2;
  if (seats < partySize) return false;

  const candidate = { date, time, durationMins };
  for (const r of reservations) {
    if (r.id === excludeReservationId) continue;
    if (r.tableId !== table.id) continue;
    if (!isReservationBlocking(r.status)) continue;
    if (reservationsOverlap(candidate, r)) return false;
  }
  return true;
}

export function getAvailableTables(
  branch: Branch,
  partySize: number,
  date: string,
  time: string,
  durationMins: number,
  reservations: Reservation[],
): Table[] {
  return branch.tables.filter((t) =>
    isTableAvailableForSlot(t, partySize, date, time, durationMins, reservations),
  );
}

/** Lunch + dinner slots every 30 min (mock service hours). */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 11; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m > 0) break;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

/**
 * Bookable slots between the daily open/close window ("HH:mm"), every `stepMins`,
 * with the last slot early enough that a `slotDurationMins` booking ends by close.
 * Driven by Settings → Reservation Time.
 */
export function generateSlots(
  openTime: string,
  closeTime: string,
  slotDurationMins: number,
  stepMins = 30,
): string[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const start = toMin(openTime);
  const lastStart = toMin(closeTime) - slotDurationMins;
  const out: string[] = [];
  for (let m = start; m <= lastStart; m += stepMins) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function dateOptions(windowDays: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    // Local Y-M-D (NOT toISOString, which is UTC and shifts a day in +offset
    // timezones — that mismatch made "Tue 11 Aug" book Mon 10 Aug).
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, {
      weekday: i === 0 ? "short" : "short",
      month: "short",
      day: "numeric",
      ...(i === 0 ? {} : {}),
    });
    out.push({ value, label: i === 0 ? `Today · ${label}` : label });
  }
  return out;
}

export function minutesUntilSlot(date: string, time: string): number {
  const start = slotStartDate(date, time).getTime();
  return (start - Date.now()) / 60_000;
}

export function computeFireAt(date: string, time: string, leadMins = 15): string {
  const start = slotStartDate(date, time);
  return new Date(start.getTime() - leadMins * 60_000).toISOString();
}

export function isSlotBookable(date: string, time: string, cutoffMins: number): boolean {
  return minutesUntilSlot(date, time) >= cutoffMins;
}
