"use client";

import { Globe } from "lucide-react";

import { useI18n } from "@/features/i18n/i18n-provider";
import { useLanguages } from "@/features/language/hooks/use-languages";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const { languages } = useLanguages();
  const active = languages.filter((l) => l.isActive);
  if (active.length <= 1) return null;

  return (
    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Globe className="size-4" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="h-8 appearance-none rounded-lg border border-input bg-white px-2 pr-6 text-sm text-ink shadow-sm outline-none focus-visible:border-brand"
        aria-label="Language"
      >
        {active.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
