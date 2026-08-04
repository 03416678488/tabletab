import { FxFetchOptions, FxProvider } from '../exchange-rate.types';

/** open.er-api.com — free, no key, 160+ currencies (incl. BDT, NGN, PKR). */
export class ErApiProvider implements FxProvider {
  readonly id = 'erapi';
  readonly label = 'open.er-api.com';
  readonly requiresKey = false;

  supportsBase(_base: string): boolean {
    return true; // broad coverage; a bad base surfaces as a fetch error → fallback
  }

  async fetchRates(
    base: string,
    symbols: string[],
    _opts: FxFetchOptions,
  ): Promise<Record<string, number>> {
    const url = `https://open.er-api.com/v6/latest/${base.toUpperCase()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`erapi ${res.status}`);
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== 'success' || !data.rates) {
      throw new Error('erapi unsuccessful response');
    }
    return pick(data.rates, symbols);
  }
}

function pick(
  rates: Record<string, number>,
  symbols: string[],
): Record<string, number> {
  const wanted = new Set(symbols.map((s) => s.toUpperCase()));
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(rates)) {
    const code = k.toUpperCase();
    if (wanted.has(code)) out[code] = v;
  }
  return out;
}
