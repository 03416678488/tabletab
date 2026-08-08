"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import en from "@/features/i18n/locales/en.json";
import bn from "@/features/i18n/locales/bn.json";
import de from "@/features/i18n/locales/de.json";
import ar from "@/features/i18n/locales/ar.json";
import {
  CURRENCY_COOKIE,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getLocale,
  splitLocalePath,
  withLocale,
  type LocaleDef,
} from "@/features/i18n/config";
import { setCurrencyConfig } from "@/lib/currency";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import type { CurrencyRow } from "@/features/app-settings/types/settings.types";

type Dict = Record<string, string>;

const DICTS: Record<string, Dict> = { en, bn, de, ar };

interface FxInfo {
  /** True when displayed prices are FX-converted from the base currency. */
  converting: boolean;
  /** Tenant's real pricing/charge currency, e.g. "USD". */
  baseCurrency: string;
  /** Currency shown to the visitor, e.g. "AED". */
  displayCurrency: string;
  /** base→display multiplier in effect (1 when not converting). */
  rate: number;
}

interface I18nContextValue {
  /** Full locale code, e.g. "en-ae". */
  locale: string;
  /** Resolved locale definition (language, region, currency, dir, ...). */
  def: LocaleDef;
  /** Switch locale — swaps the URL prefix and persists the choice. */
  setLocale: (code: string) => void;
  /** Translate a key; falls back to `fallback` or the key itself. */
  t: (key: string, fallback?: string) => string;
  /** Format a date in the active region's conventions. */
  formatDate: (value: Date | string | number, opts?: Intl.DateTimeFormatOptions) => string;
  /** Format a number in the active region's conventions. */
  formatNumber: (value: number, opts?: Intl.NumberFormatOptions) => string;
  /** FX conversion status for the active display currency. */
  fx: FxInfo;
  /** Active display currency code (override, or the region's default). */
  currency: string;
  /** True when the display currency follows the region (no manual override). */
  currencyIsAuto: boolean;
  /** Override the display currency; pass null to fall back to the region's. */
  setCurrency: (code: string | null) => void;
  /** Active, selectable currencies (from Settings → Currency). */
  currencies: CurrencyRow[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * base→target FX multiplier from the synced currency rows. `exchangeRate` is
 * stored relative to the tenant base currency. Returns null when we can't
 * convert (unknown target / missing rate) so callers can avoid mislabeling.
 */
function fxRate(currencies: CurrencyRow[], base: string, target: string): number | null {
  if (target === base) return 1;
  const row = currencies.find((c) => c.code.toUpperCase() === target);
  return row && row.exchangeRate > 0 ? row.exchangeRate : null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currencies, get } = useSettings();

  // The locale is owned by the URL (the proxy guarantees a prefix). Falling back
  // to the default keeps SSR/first-paint stable before hydration.
  const code = splitLocalePath(pathname ?? "/").locale ?? DEFAULT_LOCALE;
  const def = useMemo(() => getLocale(code), [code]);

  // Optional display-currency override (cookie), independent of the region. Null
  // = follow the region's currency. Read once on the client (SSR-safe).
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(() => {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match(/(?:^|; )tabletap\.currency=([^;]+)/);
    return m ? decodeURIComponent(m[1]).toUpperCase() : null;
  });

  // Resolve FX: base = tenant's real pricing currency; target = chosen currency
  // (manual override) or the region's default.
  const baseCurrency = (get("site", "default_currency") || "USD").toUpperCase();
  const currencyIsAuto = !currencyOverride;
  const targetCurrency = (currencyOverride ?? def.currency).toUpperCase();
  const rate = fxRate(currencies, baseCurrency, targetCurrency);
  // Only convert when we actually have a rate; otherwise show the base currency
  // (region formatting only) rather than mislabel a base amount as the target.
  const converting = rate !== null && targetCurrency !== baseCurrency;
  const displayCurrency = converting ? targetCurrency : baseCurrency;
  const effectiveRate = converting ? (rate as number) : 1;

  // Reflect language + direction on the document, and drive the whole app's money
  // display (region Intl conventions + base→display FX) via the shared config.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = def.bcp47;
      document.documentElement.dir = def.dir;
    }
    const decimals = Number(get("site", "digit_after_decimal") ?? 2);
    setCurrencyConfig({
      code: displayCurrency,
      locale: def.bcp47,
      rate: effectiveRate,
      decimals: Number.isFinite(decimals) ? decimals : 2,
    });
  }, [def, displayCurrency, effectiveRate, get]);

  const fx = useMemo<FxInfo>(
    () => ({ converting, baseCurrency, displayCurrency, rate: effectiveRate }),
    [converting, baseCurrency, displayCurrency, effectiveRate],
  );

  const setLocale = useCallback(
    (next: string) => {
      const target = getLocale(next);
      // Persist so the proxy keeps this choice on future bare-path visits.
      if (typeof document !== "undefined") {
        document.cookie = `${LOCALE_COOKIE}=${target.code}; path=/; max-age=31536000; samesite=lax`;
      }
      const { rest } = splitLocalePath(pathname ?? "/");
      router.push(withLocale(target.code, rest));
    },
    [pathname, router],
  );

  const setCurrency = useCallback((codeOrNull: string | null) => {
    const val = codeOrNull ? codeOrNull.toUpperCase() : null;
    setCurrencyOverride(val);
    if (typeof document !== "undefined") {
      document.cookie = val
        ? `${CURRENCY_COOKIE}=${val}; path=/; max-age=31536000; samesite=lax`
        : `${CURRENCY_COOKIE}=; path=/; max-age=0; samesite=lax`;
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const dict = DICTS[def.language] ?? DICTS.en;
      return dict[key] ?? DICTS.en[key] ?? fallback ?? key;
    },
    [def.language],
  );

  const formatDate = useCallback(
    (value: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(def.bcp47, opts ?? { dateStyle: "medium" }).format(new Date(value)),
    [def.bcp47],
  );

  const formatNumber = useCallback(
    (value: number, opts?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(def.bcp47, opts).format(value),
    [def.bcp47],
  );

  const value = useMemo(
    () => ({
      locale: def.code,
      def,
      setLocale,
      t,
      formatDate,
      formatNumber,
      fx,
      currency: displayCurrency,
      currencyIsAuto,
      setCurrency,
      currencies,
    }),
    [def, setLocale, t, formatDate, formatNumber, fx, displayCurrency, currencyIsAuto, setCurrency, currencies],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
