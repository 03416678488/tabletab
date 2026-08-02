"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";
import { useLanguages } from "@/features/language/hooks/use-languages";

const SELECT =
  "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

const DATE_FORMATS = ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD", "DD/MM/YYYY"];
const TIME_FORMATS = ["hh:mm A", "HH:mm"];
const TOGGLES: { key: string; label: string }[] = [
  { key: "online_payment_gateway", label: "Online Payment Gateway" },
  { key: "language_switch", label: "Language Switch" },
  { key: "email_verification", label: "Email Verification" },
  { key: "phone_verification", label: "Phone Verification" },
  { key: "app_debug", label: "App Debug" },
  { key: "guest_login", label: "Guest Login" },
];

export function SiteForm() {
  const { values, set, save, loading, saving } = useSettingsGroup("site");
  const { languages } = useLanguages();

  const onSave = async () => {
    const ok = await save();
    toast(ok ? "Site settings saved" : "Save failed", { tone: ok ? "success" : "error" });
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Site</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Date Format">
          <select className={SELECT} value={values.date_format ?? ""} onChange={(e) => set("date_format", e.target.value)}>
            {DATE_FORMATS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Time Format">
          <select className={SELECT} value={values.time_format ?? ""} onChange={(e) => set("time_format", e.target.value)}>
            {TIME_FORMATS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Default Timezone">
          <Input value={values.default_timezone ?? ""} onChange={(e) => set("default_timezone", e.target.value)} />
        </Field>
        <Field label="Default Language">
          <select className={SELECT} value={values.default_language ?? ""} onChange={(e) => set("default_language", e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Digit After Decimal (ex: 0.00)">
          <Input
            type="number"
            min={0}
            max={4}
            value={values.digit_after_decimal ?? "2"}
            onChange={(e) => set("digit_after_decimal", e.target.value)}
          />
        </Field>
        <Field label="Currency Position">
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
        <Field label="Copyright">
          <Input value={values.copyright ?? ""} onChange={(e) => set("copyright", e.target.value)} />
        </Field>
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        {TOGGLES.map((t) => (
          <div key={t.key}>
            <Label>{t.label}</Label>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
