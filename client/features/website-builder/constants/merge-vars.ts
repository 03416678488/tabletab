/**
 * Merge variables for the rich-text block — insert a `{{group.key}}` token in the
 * editor and it resolves to the matching Settings value at render time (storefront
 * + live preview). Groups: Business Info (`company`), Social links (`social`),
 * Opening hours (`hours`). Add new groups by extending MERGE_VAR_GROUPS + the
 * resolver switch below.
 */

export interface MergeVar {
  key: string;
  label: string;
}

export interface MergeVarGroup {
  /** Token namespace, e.g. "company" → {{company.name}}. */
  token: string;
  label: string;
  vars: MergeVar[];
}

const COMPANY_VARS: MergeVar[] = [
  { key: "name", label: "Business name" },
  { key: "tagline", label: "Tagline" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
];

const SOCIAL_VARS: MergeVar[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "twitter", label: "X (Twitter)" },
];

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABEL: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const HOURS_VARS: MergeVar[] = [
  { key: "today", label: "Today's hours" },
  { key: "week", label: "Full week" },
  ...DAY_KEYS.map((d) => ({ key: d, label: DAY_LABEL[d] })),
];

export const MERGE_VAR_GROUPS: MergeVarGroup[] = [
  { token: "company", label: "Business Info", vars: COMPANY_VARS },
  { token: "social", label: "Social links", vars: SOCIAL_VARS },
  { token: "hours", label: "Opening hours", vars: HOURS_VARS },
];

/** The token a variable inserts, e.g. ("company","name") → "{{company.name}}". */
export const mergeToken = (group: string, key: string) => `{{${group}.${key}}}`;

type Getter = (group: string, key: string) => string | undefined;

/** "HH:MM" (24h) → "9:00 AM". Leaves unparseable input untouched. */
function formatTime(hhmm: string): string {
  const [h, m] = (hhmm || "").split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

/** One day's opening hours as a readable string, or "Closed" / "" if unset. */
function dayHours(get: Getter, day: string): string {
  if ((get("opening_times", `${day}_closed`) ?? "") === "true") return "Closed";
  const open = get("opening_times", `${day}_open`) ?? "";
  const close = get("opening_times", `${day}_close`) ?? "";
  if (!open && !close) return "";
  return `${formatTime(open)} – ${formatTime(close)}`;
}

function hoursValue(get: Getter, key: string): string {
  if (key === "today") {
    // JS getDay(): 0=Sun … 6=Sat → our mon-first keys.
    const jsToKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return dayHours(get, jsToKey[new Date().getDay()]);
  }
  if (key === "week") {
    return DAY_KEYS.map((d) => `${DAY_LABEL[d]}: ${dayHours(get, d) || "—"}`).join(" · ");
  }
  if (DAY_KEYS.includes(key as (typeof DAY_KEYS)[number])) return dayHours(get, key);
  return "";
}

/**
 * Replace `{{group.key}}` tokens in an HTML string with their Settings value.
 * Unknown groups/keys are left untouched so typos stay visible to the author.
 */
export function resolveMergeVars(html: string, get: Getter): string {
  if (!html) return html;
  return html.replace(/\{\{\s*(\w+)\.(\w+)\s*\}\}/g, (match, group: string, key: string) => {
    switch (group) {
      case "company":
        return get("company", key) ?? "";
      case "social":
        return get("social_media", key) ?? "";
      case "hours":
        return hoursValue(get, key);
      default:
        return match; // leave unknown tokens as-is
    }
  });
}
