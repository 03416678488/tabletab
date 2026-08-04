import { Injectable, Logger } from '@nestjs/common';

import { FxConfig, FxProvider, RatesResult } from './exchange-rate.types';
import { FX_FALLBACK_ORDER } from './exchange-rate.constants';
import { FrankfurterProvider } from './providers/frankfurter.provider';
import { ErApiProvider } from './providers/erapi.provider';
import { CurrencyApiProvider } from './providers/currencyapi.provider';
import { ExchangeRateApiProvider } from './providers/exchangerate-api.provider';

/**
 * Third-party FX rate access. Tries the admin-selected provider first, then
 * falls back through the free providers so an unsupported base or a provider
 * outage never leaves rates stale silently.
 */
@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly providers: Record<string, FxProvider>;

  constructor() {
    const list: FxProvider[] = [
      new FrankfurterProvider(),
      new ErApiProvider(),
      new CurrencyApiProvider(),
      new ExchangeRateApiProvider(),
    ];
    this.providers = Object.fromEntries(list.map((p) => [p.id, p]));
  }

  getProvider(id: string): FxProvider | undefined {
    return this.providers[id];
  }

  /** Ordered list of provider ids to attempt: selected first, then free fallbacks. */
  private attemptOrder(preferred?: string): string[] {
    const order: string[] = [];
    if (preferred && this.providers[preferred]) order.push(preferred);
    for (const id of FX_FALLBACK_ORDER) {
      if (!order.includes(id) && this.providers[id]) order.push(id);
    }
    return order;
  }

  /** Fetch rates for `symbols` in `base`, trying providers in order until one works. */
  async getRates(
    base: string,
    symbols: string[],
    config: FxConfig = {},
  ): Promise<RatesResult> {
    const attempts: RatesResult['attempts'] = [];
    if (!symbols.length) return { rates: {}, providerUsed: null, attempts };

    for (const id of this.attemptOrder(config.providerId)) {
      const provider = this.providers[id];
      const apiKey = config.keys?.[id];

      if (provider.requiresKey && !apiKey) {
        attempts.push({ provider: id, error: 'missing API key' });
        continue;
      }
      if (!provider.supportsBase(base)) {
        attempts.push({ provider: id, error: `base ${base} unsupported` });
        continue;
      }

      try {
        const rates = await provider.fetchRates(base, symbols, { apiKey });
        if (Object.keys(rates).length > 0) {
          return { rates, providerUsed: id, attempts };
        }
        attempts.push({ provider: id, error: 'no rates returned' });
      } catch (err) {
        attempts.push({ provider: id, error: (err as Error).message });
      }
    }

    this.logger.warn(
      `All FX providers failed for base ${base}: ${attempts
        .map((a) => `${a.provider}(${a.error})`)
        .join(', ')}`,
    );
    return { rates: {}, providerUsed: null, attempts };
  }
}
