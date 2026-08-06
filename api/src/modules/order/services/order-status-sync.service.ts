import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Integration } from '@modules/integration/entities/integration.entity';
import { IntegrationSyncLog } from '@modules/integration/entities/integration-sync-log.entity';
import { writeSyncLog } from '@modules/integration/integration-sync-log.util';
import { resolveOutboundTarget, targetHeaders } from '@modules/integration/aggregator-target';
import { ensureFreshToken } from '@modules/integration/oauth-refresh';
import { openConfig } from '@cor/crypto/secret-cipher';

import { Order } from '../entities/order.entity';

/** Our order status → an aggregator's vocabulary. Unmapped statuses aren't
 *  relayed. Shared across aggregators for now; make it per-provider if their
 *  vocabularies diverge. */
const AGGREGATOR_STATUS: Record<string, string | undefined> = {
  confirmed: 'accepted',
  preparing: 'preparing',
  ready: 'ready_to_pick_up',
  'out-for-delivery': 'picked_up',
  delivered: 'delivered',
  completed: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Pushes an order's status back out to the aggregator it came from (foodpanda /
 * uber eats / deliveroo), keyed off `order.source`. Reads the provider config
 * from `tenant_integrations` directly (so the order module has no dependency on
 * the integration module — the reverse import already exists). Best-effort: a
 * sync failure never affects the order update.
 */
@Injectable()
export class OrderStatusSyncService {
  private readonly logger = new Logger(OrderStatusSyncService.name);

  constructor(
    @InjectRepository(Integration)
    private readonly _integrations: Repository<Integration>,
    @InjectRepository(IntegrationSyncLog)
    private readonly _logs: Repository<IntegrationSyncLog>,
  ) {}

  async syncOutbound(order: Order): Promise<void> {
    if (!order.source || !order.externalRef) return;
    const mapped = AGGREGATOR_STATUS[order.status];
    if (!mapped) return;

    const meta = { externalRef: order.externalRef, orderStatus: order.status, sent: mapped };
    try {
      const row = await this._integrations.findOne({
        where: { provider: order.source, status: 'connected' },
      });
      if (!row) return;
      const config = await ensureFreshToken(
        this._integrations,
        order.source,
        openConfig(row.config as Record<string, unknown> | null),
      );
      const target = resolveOutboundTarget(order.source, config);
      if (!target) return; // not configured for a live call — dry run

      const res = await fetch(`${target.base}/orders/${encodeURIComponent(order.externalRef)}/status`, {
        method: 'POST',
        headers: targetHeaders(target),
        body: JSON.stringify({ status: mapped }),
      });
      if (res.ok) {
        await writeSyncLog(this._logs, {
          provider: order.source,
          direction: 'status_out',
          status: 'success',
          message: `Status → ${mapped}`,
          meta,
        });
      } else {
        this.logger.warn(
          `[${order.source}] status ${order.externalRef} → ${mapped} returned ${res.status}`,
        );
        await writeSyncLog(this._logs, {
          provider: order.source,
          direction: 'status_out',
          status: 'error',
          message: `Returned ${res.status}`,
          meta,
        });
      }
    } catch (err) {
      this.logger.warn(`[${order.source}] status sync failed: ${(err as Error).message}`);
      await writeSyncLog(this._logs, {
        provider: order.source,
        direction: 'status_out',
        status: 'error',
        message: (err as Error).message,
        meta,
      });
    }
  }
}
