/**
 * App-wide currency formatting. The active config is set once by the
 * SettingsProvider (from the Site settings + Currencies), so every formatMoney
 * call reflects the configured symbol, position and decimal places.
 */
export interface CurrencyConfig {
  symbol: string;
  position: "left" | "right";
  decimals: number;
  /** Multiplier applied to base-currency amounts for display-only conversion. */
  rate: number;
}

let config: CurrencyConfig = { symbol: "$", position: "left", decimals: 2, rate: 1 };

export function setCurrencyConfig(next: Partial<CurrencyConfig>) {
  config = { ...config, ...next };
  // Clamp decimals to Intl's valid range (0–20) so a stray settings value like
  // 999 can't throw a RangeError in every price on the page.
  config.decimals = Math.min(20, Math.max(0, Math.trunc(config.decimals) || 0));
}

export function getCurrencyConfig(): CurrencyConfig {
  return config;
}

export function formatMoney(amount: number): string {
  // Prices are stored in the base currency; `rate` converts them to the visitor's
  // chosen display currency (1 = base). Symbol/side/decimals come from settings.
  const converted = (amount ?? 0) * (config.rate || 1);
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(converted);
  return config.position === "right" ? `${n}${config.symbol}` : `${config.symbol}${n}`;
}
