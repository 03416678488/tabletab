/**
 * App-wide currency + number formatting. The active config is set imperatively
 * (by SettingsProvider from Site settings, then overridden by I18nProvider with
 * the active locale's region), so every formatMoney/formatCurrency call reflects
 * the region's Intl conventions (grouping, decimals, symbol placement) and the
 * configured currency code — without each call site knowing the locale.
 */
export interface CurrencyConfig {
  /** ISO-4217 code the displayed amounts are shown in, e.g. "AED". */
  code: string;
  /** BCP-47 locale that supplies grouping/decimal/symbol conventions, e.g. "en-AE". */
  locale: string;
  /**
   * FX multiplier applied to amounts before display: amounts are stored/transacted
   * in the tenant's BASE currency, and `rate` converts base→`code`. 1 = no
   * conversion (amounts already in `code`). Set from the synced currency rates.
   */
  rate: number;
  /** Fallback symbol when Intl can't resolve one (rare). */
  symbol: string;
  position: "left" | "right";
  decimals: number;
}

let config: CurrencyConfig = {
  code: "USD",
  locale: "en-US",
  rate: 1,
  symbol: "$",
  position: "left",
  decimals: 2,
};

export function setCurrencyConfig(next: Partial<CurrencyConfig>) {
  config = { ...config, ...next };
}

export function getCurrencyConfig(): CurrencyConfig {
  return config;
}

/**
 * Format money using the active region's Intl conventions. Falls back to a
 * manual symbol+fixed-decimals string if Intl throws (unknown currency code).
 */
export function formatMoney(amount: number, currencyCode?: string): string {
  // An explicit code is shown as-is (already in that currency); otherwise apply
  // the base→display FX conversion for the active region.
  const code = currencyCode || config.code;
  const value = (amount ?? 0) * (currencyCode ? 1 : config.rate);
  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(value);
  } catch {
    const n = value.toFixed(config.decimals);
    return config.position === "right" ? `${n}${config.symbol}` : `${config.symbol}${n}`;
  }
}

/** Convert a base-currency amount to the active display currency (raw number). */
export function convertFromBase(amount: number): number {
  return (amount ?? 0) * config.rate;
}
