import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Integration } from '@modules/integration/entities/integration.entity';
import { openConfig } from '@cor/crypto/secret-cipher';

import { MenuItem } from '../entities/menu-item.entity';

/** Coalesce a burst of menu edits into one push after this much quiet. */
const DEBOUNCE_MS = 8_000;

/**
 * Auto-pushes the menu to connected aggregators when it changes — debounced per
 * tenant so a flurry of edits produces one push, not one per edit.
 *
 * Singleton (holds the debounce timers across requests) so it can't use the
 * request-scoped tenant repos; instead it operates on the tenant's pooled
 * `DataSource`, which the caller passes in and which outlives the request.
 * Best-effort throughout — never affects the edit that triggered it.
 */
@Injectable()
export class MenuSyncService {
  private readonly logger = new Logger(MenuSyncService.name);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  /** Schedule (or reset) a debounced menu push for a tenant. */
  schedule(tenantKey: string, dataSource: DataSource): void {
    const existing = this.timers.get(tenantKey);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.timers.delete(tenantKey);
      void this.push(dataSource);
    }, DEBOUNCE_MS);
    // Don't hold the process open for a pending push.
    if (typeof timer.unref === 'function') timer.unref();

    this.timers.set(tenantKey, timer);
  }

  private async push(dataSource: DataSource): Promise<void> {
    const integrations = dataSource.getRepository(Integration);

    // Every connected integration with a live API base gets the menu.
    const rows = await integrations.find({ where: { status: 'connected' } });
    const targets = rows
      .map((row) => {
        const config = openConfig(row.config as Record<string, unknown> | null);
        const base =
          typeof config.apiBaseUrl === 'string' ? config.apiBaseUrl.trim().replace(/\/$/, '') : '';
        return base ? { row, config, base } : null;
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
    if (targets.length === 0) return;

    const snapshot = await this.snapshot(dataSource);
    const body = JSON.stringify(snapshot);

    for (const { row, config, base } of targets) {
      try {
        const res = await fetch(`${base}/menu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
          },
          body,
        });
        if (res.ok) {
          await integrations.update({ id: row.id }, { lastSyncAt: new Date() });
        } else {
          this.logger.warn(`[${row.provider}] auto menu push returned ${res.status}`);
        }
      } catch (err) {
        this.logger.warn(`[${row.provider}] auto menu push failed: ${(err as Error).message}`);
      }
    }
  }

  /** Same shape as MenuIoService.snapshot(), but off the passed DataSource. */
  private async snapshot(dataSource: DataSource) {
    const items = await dataSource.getRepository(MenuItem).find({
      relations: ['category'],
      order: { name: 'ASC' },
    });
    const categoryNames = new Set<string>();
    const mapped = items.map((it) => {
      const category = it.category?.name ?? null;
      if (category) categoryNames.add(category);
      return {
        name: it.name,
        description: it.description ?? null,
        price: it.price,
        category,
        available: it.isAvailable,
      };
    });
    return {
      categories: [...categoryNames].map((name) => ({ name })),
      items: mapped,
    };
  }
}
