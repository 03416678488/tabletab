/** Shared weekly opening-hours model, used by the global setting and per-branch. */

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DaySchedule {
  closed: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export type WeeklyHours = Record<DayKey, DaySchedule>;

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

export const emptyWeek = (): WeeklyHours =>
  DAYS.reduce((acc, d) => {
    acc[d.key] = { closed: false, open: "", close: "" };
    return acc;
  }, {} as WeeklyHours);

/** Flat settings map (mon_open / mon_close / mon_closed) → structured week. */
export function flatToWeekly(values: Record<string, string>): WeeklyHours {
  return DAYS.reduce((acc, d) => {
    acc[d.key] = {
      closed: (values[`${d.key}_closed`] ?? "") === "true",
      open: values[`${d.key}_open`] ?? "",
      close: values[`${d.key}_close`] ?? "",
    };
    return acc;
  }, {} as WeeklyHours);
}

/** Structured week → flat settings map for the key-value settings store. */
export function weeklyToFlat(week: WeeklyHours): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of DAYS) {
    const s = week[d.key];
    out[`${d.key}_closed`] = s.closed ? "true" : "";
    out[`${d.key}_open`] = s.closed ? "" : s.open;
    out[`${d.key}_close`] = s.closed ? "" : s.close;
  }
  return out;
}

/** Coerce arbitrary stored JSON into a full week (fills any missing days). */
export function coerceWeek(value: unknown): WeeklyHours {
  const src = (value ?? {}) as Partial<Record<DayKey, Partial<DaySchedule>>>;
  return DAYS.reduce((acc, d) => {
    const s = src[d.key] ?? {};
    acc[d.key] = {
      closed: Boolean(s.closed),
      open: typeof s.open === "string" ? s.open : "",
      close: typeof s.close === "string" ? s.close : "",
    };
    return acc;
  }, {} as WeeklyHours);
}

/** A one-line human summary, e.g. "Mon–Fri 09:00–22:00 · Sat 10:00–23:00 · Sun closed". */
export function summariseWeek(week: WeeklyHours): string {
  return DAYS.map((d) => {
    const s = week[d.key];
    if (s.closed) return `${d.short} closed`;
    if (!s.open && !s.close) return `${d.short} —`;
    return `${d.short} ${s.open || "?"}–${s.close || "?"}`;
  }).join(" · ");
}
