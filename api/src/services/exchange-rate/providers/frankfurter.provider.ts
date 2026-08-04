import { FxFetchOptions, FxProvider } from '../exchange-rate.types';
import { FRANKFURTER_CODES } from '../exchange-rate.constants';

/** European Central Bank rates via frankfurter.dev — free, no key. */
export class FrankfurterProvider implements FxProvider {
  readonly id = 'frankfurter';
  readonly label = 'Frankfurter (ECB)';
  readonly requiresKey = false;

  supportsBase(base: string): boolean {
    return FRANKFURTER_CODES.has(base.toUpperCase());
  }

  async fetchRates(
    base: string,
    symbols: string[],
    _opts: FxFetchOptions,
  ): Promise<Record<string, number>> {
    const wanted = symbols
      .map((s) => s.toUpperCase())
      .filter((s) => FRANKFURTER_CODES.has(s));
    if (!wanted.length) return {};

    const url = `https://api.frankfurter.dev/v1/latest?base=${base.toUpperCase()}&symbols=${wanted.join(',')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`frankfurter ${res.status}`);
    const data = (await res.json()) as { rates?: Record<string, number> };
    return upper(data.rates ?? {});
  }
}

function upper(rates: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(rates)) out[k.toUpperCase()] = v;
  return out;
}
