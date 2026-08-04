import { FxFetchOptions, FxProvider } from '../exchange-rate.types';

/** Fawaz Ahmed's currency-api via jsDelivr CDN — free, no key, 200+ incl. crypto. */
export class CurrencyApiProvider implements FxProvider {
  readonly id = 'currencyapi';
  readonly label = 'Fawaz currency-api';
  readonly requiresKey = false;

  supportsBase(_base: string): boolean {
    return true;
  }

  async fetchRates(
    base: string,
    symbols: string[],
    _opts: FxFetchOptions,
  ): Promise<Record<string, number>> {
    const b = base.toLowerCase();
    const primary = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${b}.json`;
    const fallback = `https://latest.currency-api.pages.dev/v1/currencies/${b}.json`;

    const data = await this.get(primary).catch(() => this.get(fallback));
    const rates = (data?.[b] ?? {}) as Record<string, number>;
    if (!Object.keys(rates).length) throw new Error('currencyapi empty');

    const wanted = new Set(symbols.map((s) => s.toLowerCase()));
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(rates)) {
      if (wanted.has(k.toLowerCase())) out[k.toUpperCase()] = v;
    }
    return out;
  }

  private async get(url: string): Promise<Record<string, unknown>> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`currencyapi ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }
}
