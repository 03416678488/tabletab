"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";

const DATE_FORMATS = ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD", "DD/MM/YYYY"];
const TIME_FORMATS = ["hh:mm A", "HH:mm"];

/**
 * Full IANA timezone list from the runtime (Intl.supportedValuesOf), so the
 * options always match what Intl.DateTimeFormat accepts. Falls back to a short
 * curated set on older runtimes that lack supportedValuesOf.
 */
const TIMEZONES: string[] = (() => {
  const withUtc = (list: string[]) => ["UTC", ...list.filter((z) => z !== "UTC")];
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
    ).supportedValuesOf?.("timeZone");
    if (supported?.length) return withUtc(supported);
  } catch {
    /* fall through to the curated list */
  }
  return withUtc([
    "Asia/Karachi",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Australia/Sydney",
  ]);
})();
const TOGGLES: { key: string; label: string; hint: string; example: string }[] = [
  {
    key: "online_payment_gateway",
    label: "Online Payment Gateway",
    hint: "Let customers pay online (card/wallet) at checkout. When off, only offline options like cash-on-delivery are shown.",
    example: "Off → checkout shows just “Cash on delivery”.",
  },
  {
    key: "language_switch",
    label: "Language Switch",
    hint: "Show the language picker so visitors can change the site language. When off, the switcher is hidden everywhere.",
    example: "On → a 🌐 language menu appears in the header.",
  },
  {
    key: "app_debug",
    label: "App Debug",
    hint: "Show detailed technical error info (message + stack trace) when something crashes. Turn on only while troubleshooting.",
    example: "On → crash screen shows the real error, not just “Something went wrong”.",
  },
  {
    key: "guest_login",
    label: "Guest Login",
    hint: "Allow customers to order without creating an account. When off, they must sign in first.",
    example: "On → “Continue as guest” is available at checkout.",
  },
];

export function SiteForm() {
  const { values, set, unset, save, loading, saving } = useSettingsGroup("site");

  // Retired fields — drop any stale values so a save never re-writes them.
  useEffect(() => {
    if ("email_verification" in values) unset("email_verification");
    if ("phone_verification" in values) unset("phone_verification");
    if ("default_language" in values) unset("default_language");
  }, [values, unset]);

  const onSave = async () => {
    const ok = await save();
    toast(ok ? "Site settings saved" : "Save failed", { tone: ok ? "success" : "error" });
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">System</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          label="Date Format"
          hint="How calendar dates are shown across the whole app."
          example="10th Aug 2026 → MM-DD-YYYY shows 08-10-2026, YYYY-MM-DD shows 2026-08-10."
        >
          <Dropdown
            value={values.date_format ?? ""}
            onChange={(v) => set("date_format", v)}
            aria-label="Date format"
            options={DATE_FORMATS.map((f) => ({ value: f, label: f }))}
          />
        </Field>
        <Field
          label="Time Format"
          hint="12-hour (with AM/PM) or 24-hour clock, used everywhere times are shown."
          example="Half past 2 in the afternoon → hh:mm A = 02:30 PM, HH:mm = 14:30."
        >
          <Dropdown
            value={values.time_format ?? ""}
            onChange={(v) => set("time_format", v)}
            aria-label="Time format"
            options={TIME_FORMATS.map((f) => ({ value: f, label: f }))}
          />
        </Field>
        <Field
          label="Default Timezone"
          hint="The timezone all dates and times are displayed in, no matter where the viewer is."
          example="An order placed at 14:30 UTC shows as 19:30 when set to Asia/Karachi."
        >
          <Dropdown
            value={values.default_timezone ?? "UTC"}
            onChange={(v) => set("default_timezone", v)}
            aria-label="Default timezone"
            searchable
            options={TIMEZONES.map((z) => ({ value: z, label: z }))}
          />
        </Field>
        <Field
          label="Digit After Decimal (ex: 0.00)"
          hint="How many decimal places prices show throughout the app."
          example="2 → $9.50, 0 → $10, 3 → $9.500."
        >
          <Input
            type="number"
            min={0}
            max={4}
            value={values.digit_after_decimal ?? "2"}
            onChange={(e) => set("digit_after_decimal", e.target.value)}
          />
        </Field>
        <Field
          label="Currency Position"
          hint="Which side of the amount the currency symbol sits on."
          example="Left → $9.50, Right → 9.50$."
        >
          <div className="flex gap-4 pt-2 text-sm">
            {[
              { v: "left", label: "() Left" },
              { v: "right", label: "Right ()" },
            ].map((o) => (
              <label key={o.v} className="flex items-center gap-2">
                <input
                  type="radio"
                  className="size-4 accent-brand"
                  checked={(values.currency_position ?? "left") === o.v}
                  onChange={() => set("currency_position", o.v)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        {TOGGLES.map((t) => (
          <div key={t.key}>
            <div className="flex items-center gap-1.5">
              <Label>{t.label}</Label>
              <InfoHint text={t.hint} example={t.example} />
            </div>
            <div className="mt-1.5 flex gap-4 text-sm">
              {["enable", "disable"].map((v) => (
                <label key={v} className="flex items-center gap-2 capitalize">
                  <input
                    type="radio"
                    className="size-4 accent-brand"
                    checked={(values[t.key] ?? "disable") === v}
                    onChange={() => set(t.key, v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button className="mt-5" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save
      </Button>
    </Card>
  );
}

function Field({
  label,
  hint,
  example,
  children,
}: {
  label: string;
  hint?: string;
  example?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        {hint && <InfoHint text={hint} example={example} />}
      </div>
      {children}
    </div>
  );
}

/**
 * Small "!" info icon that reveals a description (and example) on hover/focus.
 * Pure CSS visibility via `group` so there's no extra state; focusable for
 * keyboard/touch users.
 */
function InfoHint({ text, example }: { text: string; example?: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={example ? `${text} Example: ${example}` : text}
        className="flex size-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-bold leading-none text-muted-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        !
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-left text-xs leading-relaxed text-white opacity-0 shadow-[var(--shadow-elevated)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span className="block">{text}</span>
        {example && <span className="mt-1 block text-white/70">e.g. {example}</span>}
      </span>
    </span>
  );
}
