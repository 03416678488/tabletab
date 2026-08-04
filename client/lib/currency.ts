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
}

export function getCurrencyConfig(): CurrencyConfig {
  return config;
}

export function formatMoney(amount: number): string {
  const n = (amount ?? 0).toFixed(config.decimals);
  return config.position === "right" ? `${n}${config.symbol}` : `${config.symbol}${n}`;
}
