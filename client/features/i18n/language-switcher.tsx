"use client";

import { Globe } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";

import { useI18n } from "@/features/i18n/i18n-provider";
import { useLanguages } from "@/features/language/hooks/use-languages";
import { useSettings } from "@/features/app-settings/components/settings-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const { languages } = useLanguages();
  const { get } = useSettings();
  // Settings → System: hide the switcher entirely when Language Switch is off.
  if (get("site", "language_switch") !== "enable") return null;
  const active = languages.filter((l) => l.isActive);
  if (active.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Globe className="size-4" />
      <Dropdown
        value={locale}
        onChange={(v) => setLocale(v)}
        variant="bare"
        aria-label="Language"
        options={active.map((l) => ({ value: l.code, label: l.name }))}
      />
    </div>
  );
}
