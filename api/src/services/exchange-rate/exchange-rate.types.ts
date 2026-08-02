export interface FxFetchOptions {
  apiKey?: string;
}

/** A single FX rate source (ECB, ER-API, …). Implementations live in ./providers. */
export interface FxProvider {
  readonly id: string;
  readonly label: string;
  readonly requiresKey: boolean;
  /** Whether this provider can express rates in `base` (upper-case ISO code). */
  supportsBase(base: string): boolean;
  /** Rates keyed by UPPER-case code, relative to `base`. Throws on failure. */
  fetchRates(
    base: string,
    symbols: string[],
    opts: FxFetchOptions,
  ): Promise<Record<string, number>>;
}

export interface FxConfig {
  /** Preferred provider id; falls back through the free providers if it fails. */
  providerId?: string;
  /** Per-provider API keys, keyed by provider id. */
  keys?: Record<string, string>;
}

export interface RatesResult {
  rates: Record<string, number>;
  /** Provider id that actually produced the rates, or null if all failed. */
  providerUsed: string | null;
  /** Providers that were tried and failed, for diagnostics. */
  attempts: { provider: string; error: string }[];
}
