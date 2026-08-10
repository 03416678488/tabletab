/**
 * App-wide date & time formatting. The active config is set once by the
 * SettingsProvider (from Settings → System: date_format, time_format,
 * default_timezone), so every formatDate / formatTime / formatDateTime call
 * across the app renders in the tenant's configured format and timezone.
 */
export interface DateTimeConfig {
  /** One of: DD-MM-YYYY, MM-DD-YYYY, YYYY-MM-DD, DD/MM/YYYY. */
  dateFormat: string;
  /** "hh:mm A" (12-hour) or "HH:mm" (24-hour). */
  timeFormat: string;
  /** IANA zone, e.g. "Asia/Karachi". Empty → the viewer's local zone. */
  timezone?: string;
}

let config: DateTimeConfig = {
  dateFormat: "DD-MM-YYYY",
  timeFormat: "hh:mm A",
  timezone: undefined,
};

export function setDateTimeConfig(next: Partial<DateTimeConfig>) {
  config = { ...config, ...next };
}

export function getDateTimeConfig(): DateTimeConfig {
  return config;
}

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

/** Numeric date/time parts in the configured timezone. */
function zonedParts(d: Date): Record<string, string> {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  let dtf: Intl.DateTimeFormat;
  try {
    // A bad free-text timezone (Settings → System) throws RangeError — fall back
    // to the viewer's local zone rather than breaking every date on the page.
    dtf = new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: config.timezone || undefined });
  } catch {
    dtf = new Intl.DateTimeFormat("en-GB", opts);
  }
  const out: Record<string, string> = {};
  for (const p of dtf.formatToParts(d)) out[p.type] = p.value;
  return out;
}

/** Format a date per the configured `date_format` + timezone. */
export function formatDate(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "";
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return "";
  const p = zonedParts(d);
  return config.dateFormat.replace("YYYY", p.year).replace("DD", p.day).replace("MM", p.month);
}

/** Format a time per the configured `time_format` + timezone. */
export function formatTime(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "";
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return "";
  const p = zonedParts(d);
  if (config.timeFormat === "HH:mm") return `${p.hour}:${p.minute}`;
  let h = Number(p.hour);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${p.minute} ${ampm}`;
}

/** Format date + time together, per the configured formats + timezone. */
export function formatDateTime(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "";
  const date = formatDate(input);
  const time = formatTime(input);
  return date && time ? `${date} ${time}` : date || time;
}
