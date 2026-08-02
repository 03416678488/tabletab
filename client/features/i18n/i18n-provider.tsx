"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSettings } from "@/features/app-settings/components/settings-provider";
import en from "@/features/i18n/locales/en.json";
import bn from "@/features/i18n/locales/bn.json";
import de from "@/features/i18n/locales/de.json";
import ar from "@/features/i18n/locales/ar.json";

type Dict = Record<string, string>;

const DICTS: Record<string, Dict> = { en, bn, de, ar };
const RTL = new Set(["ar", "he", "fa", "ur"]);
const STORAGE_KEY = "tabletap.locale";

interface I18nContextValue {
  locale: string;
  setLocale: (code: string) => void;
  /** Translate a key; falls back to `fallback` or the key itself. */
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { get } = useSettings();
  const [locale, setLocaleState] = useState("en");

  // Initial locale: saved choice → site default → en.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const fallback = get("site", "default_language") || "en";
    setLocaleState(saved || fallback);
  }, [get]);

  // Reflect language direction on the document.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = RTL.has(locale) ? "rtl" : "ltr";
    }
  }, [locale]);

  const setLocale = useCallback((code: string) => {
    setLocaleState(code);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const dict = DICTS[locale] ?? DICTS.en;
      return dict[key] ?? DICTS.en[key] ?? fallback ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
