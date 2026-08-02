import { FxFetchOptions, FxProvider } from '../exchange-rate.types';

/** ExchangeRate-API v6 — requires a (free) API key. 160+ currencies. */
export class ExchangeRateApiProvider implements FxProvider {
  readonly id = 'exchangerate_api';
  readonly label = 'ExchangeRate-API (v6)';
  readonly requiresKey = true;

  supportsBase(_base: string): boolean {
    return true;
  }

  async fetchRates(
    base: string,
    symbols: string[],
    opts: FxFetchOptions,
  ): Promise<Record<string, number>> {
    if (!opts.apiKey) throw new Error('exchangerate_api missing key');
    const url = `https://v6.exchangerate-api.com/v6/${opts.apiKey}/latest/${base.toUpperCase()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`exchangerate_api ${res.status}`);
    const data = (await res.json()) as {
      result?: string;
      conversion_rates?: Record<string, number>;
    };
    if (data.result !== 'success' || !data.conversion_rates) {
      throw new Error('exchangerate_api unsuccessful response');
    }
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(data.conversion_rates)) {
      const code = k.toUpperCase();
      if (wanted.has(code)) out[code] = v;
    }
    return out;
  }
}
