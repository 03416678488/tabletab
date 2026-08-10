/**
 * App-wide currency formatting. The active config is set once by the
 * SettingsProvider (from the Site settings + Currencies), so every formatMoney
 * call reflects the configured symbol, position and decimal places.
 */
export interface CurrencyConfig {
  symbol: string;
  position: "left" | "right";
  decimals: number;
}

let config: CurrencyConfig = { symbol: "$", position: "left", decimals: 2 };

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
  // Group thousands and honour the configured decimal places; the symbol and
  // its side come from the tenant's Site settings (set by SettingsProvider).
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount ?? 0);
  return config.position === "right" ? `${n}${config.symbol}` : `${config.symbol}${n}`;
}
