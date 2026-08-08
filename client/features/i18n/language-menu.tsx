"use client";

import { useMemo } from "react";

import { IconSelect } from "@/features/i18n/icon-select";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useLanguages } from "@/features/language/hooks/use-languages";
import { LANGUAGE_LABELS, LOCALES, localeForLanguage } from "@/features/i18n/config";

/**
 * Language switcher — a colorful globe that opens a dropdown on click. The list
 * is driven by the active languages in Settings → Languages (`/languages`),
 * limited to languages the app can route to (that have a locale in the registry).
 */
export function LanguageMenu({ align }: { align?: "start" | "end" }) {
  const { def, setLocale } = useI18n();
  const { languages } = useLanguages();

  const options = useMemo(() => {
    const routable = languages.filter(
      (l) => l.isActive && LOCALES.some((loc) => loc.language === l.code),
    );
    const rows = routable.length
      ? routable.map((l) => ({ code: l.code, name: l.name }))
      : LOCALES.reduce<{ code: string; name: string }[]>((acc, l) => {
          if (!acc.some((x) => x.code === l.language)) acc.push({ code: l.language, name: l.language });
          return acc;
        }, []);
    return rows.map((r) => ({ value: r.code, label: LANGUAGE_LABELS[r.code] ?? r.name }));
  }, [languages]);

  if (options.length <= 1) return null;

  const current = options.find((o) => o.value === def.language)?.label ?? def.language;

  return (
    <IconSelect
      icon="🌐"
      ariaLabel="Language"
      title={`Language: ${current}`}
      align={align}
      value={def.language}
      options={options}
      onChange={(code) => setLocale(localeForLanguage(code, def.region))}
    />
  );
}
