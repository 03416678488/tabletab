import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import { Integration } from '@modules/integration/entities/integration.entity';
import { IntegrationSyncLog } from '@modules/integration/entities/integration-sync-log.entity';
import { writeSyncLog } from '@modules/integration/integration-sync-log.util';
import {
  resolveOutboundTarget,
  targetHeaders,
} from '@modules/integration/aggregator-target';
import { ensureFreshToken } from '@modules/integration/oauth-refresh';
import { openConfig } from '@cor/crypto/secret-cipher';

import { MenuItem } from '../entities/menu-item.entity';

/** Coalesce a burst of menu edits into one delta push after this much quiet. */
const DEBOUNCE_MS = 8_000;

interface Pending {
  dataSource: DataSource;
  ids: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Auto-pushes menu changes to connected aggregators as a DELTA (only the items
 * that changed), debounced per tenant. Deleted items are sent as `removes`.
 *
 * Singleton (holds debounce state + the accumulated changed-id set across
 * requests) so it operates on the tenant's pooled DataSource passed in. Manual
 * "Push menu" stays a full catalog sync (AggregatorService.pushMenu) — this is
 * the incremental path. Best-effort throughout.
 */
@Injectable()
export class MenuSyncService {
  private readonly logger = new Logger(MenuSyncService.name);
  private readonly pending = new Map<string, Pending>();

  /** Queue a changed item for a debounced delta push (per tenant). */
  schedule(tenantKey: string, dataSource: DataSource, itemId: string): void {
    let entry = this.pending.get(tenantKey);
    if (!entry) {
      entry = { dataSource, ids: new Set(), timer: null };
      this.pending.set(tenantKey, entry);
    }
    entry.dataSource = dataSource;
    entry.ids.add(itemId);

    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      const e = this.pending.get(tenantKey);
      this.pending.delete(tenantKey);
      if (e) void this.pushDelta(e.dataSource, [...e.ids]);
    }, DEBOUNCE_MS);
    if (typeof entry.timer.unref === 'function') entry.timer.unref();
  }

  private async pushDelta(
    dataSource: DataSource,
    ids: string[],
  ): Promise<void> {
    if (ids.length === 0) return;

    // Changed ids that still exist → upserts; the rest were deleted → removes.
    const items = await dataSource.getRepository(MenuItem).find({
      where: { id: In(ids) },
      relations: ['categories'],
    });
    const found = new Set(items.map((i) => i.id));
    const upserts = items.map((it) => ({
      id: it.id,
      name: it.name,
      description: it.description ?? null,
      price: it.price,
      category: it.categories?.[0]?.name ?? null,
      available: it.isAvailable,
    }));
    const removes = ids.filter((id) => !found.has(id));
    if (upserts.length === 0 && removes.length === 0) return;

    const integrations = dataSource.getRepository(Integration);
    const rows = await integrations.find({ where: { status: 'connected' } });
    const logs = dataSource.getRepository(IntegrationSyncLog);
    const meta = {
      upserts: upserts.length,
      removes: removes.length,
      delta: true,
    };
    const body = JSON.stringify({ upserts, removes });

    for (const row of rows) {
      const config = await ensureFreshToken(
        integrations,
        row.provider,
        openConfig(row.config as Record<string, unknown> | null),
      );
      const target = resolveOutboundTarget(row.provider, config);
      if (!target) continue;

      try {
        const res = await fetch(`${target.base}/menu/items`, {
          method: 'POST',
          headers: targetHeaders(target),
          body,
        });
        if (res.ok) {
          await integrations.update({ id: row.id }, { lastSyncAt: new Date() });
          await writeSyncLog(logs, {
            provider: row.provider,
            direction: 'menu_out',
            status: 'success',
            message: `Menu delta — ${upserts.length} changed, ${removes.length} removed`,
            meta,
          });
        } else {
          this.logger.warn(
            `[${row.provider}] menu delta returned ${res.status}`,
          );
          await writeSyncLog(logs, {
            provider: row.provider,
            direction: 'menu_out',
            status: 'error',
            message: `Returned ${res.status}`,
            meta,
          });
        }
      } catch (err) {
        this.logger.warn(
          `[${row.provider}] menu delta failed: ${(err as Error).message}`,
        );
        await writeSyncLog(logs, {
          provider: row.provider,
          direction: 'menu_out',
          status: 'error',
          message: (err as Error).message,
          meta,
        });
      }
    }
  }
}
