export type SettingsGroups = Record<string, Record<string, string>>;

export interface CurrencyRow {
  id: number;
  name: string;
  symbol: string;
  code: string;
  exchangeRate: number;
  isActive: boolean;
}
