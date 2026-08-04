export interface Currency {
  id: number;
  name: string;
  symbol: string;
  code: string;
  exchangeRate: number;
  isActive: boolean;
  autoUpdate: boolean;
}

export interface CurrencyInput {
  name: string;
  symbol: string;
  code: string;
  exchangeRate?: number;
  isActive?: boolean;
  autoUpdate?: boolean;
}

export interface SyncResult {
  base: string;
  provider: string | null;
  updated: number;
  skipped: string[];
  syncedAt: string;
}

export interface FxProviderMeta {
  id: string;
  label: string;
  requiresKey: boolean;
  note: string;
}

export interface FxSettings {
  provider: string;
  frequency: string;
  keys: Record<string, string>;
  providers: FxProviderMeta[];
  frequencies: { value: string; label: string }[];
  syncedAt: string;
  lastProvider: string;
}

export interface FxSettingsInput {
  provider?: string;
  frequency?: string;
  keys?: Record<string, string>;
}
