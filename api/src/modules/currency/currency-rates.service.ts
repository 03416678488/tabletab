import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';

import { SettingService } from '@modules/setting/setting.service';
import { ExchangeRateService } from '@services/exchange-rate';
import { Currency } from './entities/currency.entity';

const JOB_NAME = 'currency-rates-sync';

/** Sync frequency → cron expression. */
export const FX_FREQUENCIES: { value: string; label: string; cron: string | null }[] = [
  { value: 'off', label: 'Off (manual only)', cron: null },
  { value: 'hourly', label: 'Every hour', cron: '0 * * * *' },
  { value: '6h', label: 'Every 6 hours', cron: '0 */6 * * *' },
  { value: '12h', label: 'Every 12 hours', cron: '0 */12 * * *' },
  { value: 'daily', label: 'Daily', cron: '0 5 * * *' },
  { value: 'weekly', label: 'Weekly', cron: '0 5 * * 1' },
];

export interface FxSettings {
  provider: string;
  frequency: string;
  keys: Record<string, string>;
}

export interface SyncResult {
  base: string;
  provider: string | null;
  updated: number;
  skipped: string[];
  syncedAt: string;
}

@Injectable()
export class CurrencyRatesService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyRatesService.name);

  constructor(
    @InjectRepository(Currency)
    private readonly _repo: Repository<Currency>,
    private readonly _settings: SettingService,
    private readonly _exchange: ExchangeRateService,
    private readonly _scheduler: SchedulerRegistry,
  ) {}

  /** Register the cron job on boot using the configured frequency. */
  async onModuleInit(): Promise<void> {
    await this.applySchedule();
  }

  /** Read the admin FX config (provider / frequency / keys). */
  async getSettings(): Promise<FxSettings> {
    const fx = await this._settings.getGroup('fx');
    return {
      provider: fx.provider || 'erapi',
      frequency: fx.frequency || 'daily',
      keys: { exchangerate_api: fx.key_exchangerate_api || '' },
    };
  }

  /** Persist the FX config and re-arm the schedule. */
  async saveSettings(input: {
    provider?: string;
    frequency?: string;
    keys?: Record<string, string>;
  }): Promise<FxSettings> {
    const patch: Record<string, string> = {};
    if (input.provider) patch.provider = input.provider;
    if (input.frequency) patch.frequency = input.frequency;
    if (input.keys?.exchangerate_api !== undefined) {
      patch.key_exchangerate_api = input.keys.exchangerate_api;
    }
    await this._settings.saveGroup('fx', patch);
    await this.applySchedule();
    return this.getSettings();
  }

  /** (Re)create the cron job from the configured frequency. */
  async applySchedule(): Promise<void> {
    if (this._scheduler.doesExist('cron', JOB_NAME)) {
      this._scheduler.deleteCronJob(JOB_NAME);
    }
    const { frequency } = await this.getSettings();
    const cron = FX_FREQUENCIES.find((f) => f.value === frequency)?.cron;
    if (!cron) {
      this.logger.log('FX auto-sync is off');
      return;
    }
    const job = CronJob.from({
      cronTime: cron,
      onTick: () => void this.scheduledSync(),
    });
    this._scheduler.addCronJob(JOB_NAME, job as never);
    job.start();
    this.logger.log(`FX auto-sync scheduled: ${frequency} (${cron})`);
  }

  private async scheduledSync(): Promise<void> {
    try {
      const res = await this.syncRates();
      this.logger.log(
        `FX sync via ${res.provider}: base=${res.base}, updated=${res.updated}, skipped=[${res.skipped.join(', ')}]`,
      );
    } catch (err) {
      this.logger.error(`FX sync failed: ${(err as Error).message}`);
    }
  }

  /** Pull rates from the configured provider (with fallback) and update rows. */
  async syncRates(): Promise<SyncResult> {
    const site = await this._settings.getGroup('site');
    const base = (site.default_currency || 'USD').toUpperCase();
    const { provider, keys } = await this.getSettings();

    const currencies = await this._repo.find();
    const targets = currencies.filter((c) => c.autoUpdate);
    const symbols = targets
      .map((c) => c.code.toUpperCase())
      .filter((code) => code !== base);

    const result = await this._exchange.getRates(base, symbols, {
      providerId: provider,
      keys,
    });

    let updated = 0;
    const skipped: string[] = [];
    for (const c of targets) {
      const code = c.code.toUpperCase();
      if (code === base) {
        if (c.exchangeRate !== 1) {
          await this._repo.update(c.id, { exchangeRate: 1 });
          updated++;
        }
        continue;
      }
      const rate = result.rates[code];
      if (typeof rate === 'number' && rate > 0) {
        await this._repo.update(c.id, { exchangeRate: round(rate) });
        updated++;
      } else {
        skipped.push(code);
      }
    }

    const syncedAt = new Date().toISOString();
    await this._settings.saveGroup('site', { currency_rates_synced_at: syncedAt });
    await this._settings.saveGroup('fx', {
      last_provider: result.providerUsed ?? '',
    });

    return { base, provider: result.providerUsed, updated, skipped, syncedAt };
  }
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e6) / 1e6;
}
