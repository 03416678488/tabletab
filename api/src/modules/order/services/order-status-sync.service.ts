import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Integration } from '@modules/integration/entities/integration.entity';
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
  ) {}

  async syncOutbound(order: Order): Promise<void> {
    if (!order.source || !order.externalRef) return;
    const mapped = AGGREGATOR_STATUS[order.status];
    if (!mapped) return;

    try {
      const row = await this._integrations.findOne({
        where: { provider: order.source, status: 'connected' },
      });
      const config = openConfig(row?.config as Record<string, unknown> | null);
      const base =
        typeof config.apiBaseUrl === 'string' ? config.apiBaseUrl.trim().replace(/\/$/, '') : '';
      if (!base) return; // no live endpoint configured — dry run

      const res = await fetch(`${base}/orders/${encodeURIComponent(order.externalRef)}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({ status: mapped }),
      });
      if (!res.ok) {
        this.logger.warn(
          `[${order.source}] status ${order.externalRef} → ${mapped} returned ${res.status}`,
        );
      }
    } catch (err) {
      this.logger.warn(`[${order.source}] status sync failed: ${(err as Error).message}`);
    }
  }
}
