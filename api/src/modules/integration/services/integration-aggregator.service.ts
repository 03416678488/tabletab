import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { OrderService } from '@modules/order/order.service';
import { MenuIoService } from '@modules/menu/services/menu-io.service';

import { constantTimeEqual } from '@cor/crypto/secret-cipher';

import { IntegrationService } from '../integration.service';
import { findConnector } from '../integration.catalog';
import { normalizeOrder } from '../aggregator-normalizers';
import { resolveOutboundTarget, targetHeaders } from '../aggregator-target';

export interface MenuPushResult {
  items: number;
  categories: number;
  /** 'sent' when POSTed to a configured URL, 'prepared' for a dry run. */
  status: 'sent' | 'prepared';
}

/**
 * Generic delivery-aggregator connector (foodpanda / uber eats / deliveroo).
 * Provider-parameterized: order ingestion (webhook → KDS via OrderService),
 * and menu push out. All keyed off the catalog + the tenant's stored config.
 */
@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(
    private readonly _integrations: IntegrationService,
    private readonly _orders: OrderService,
    private readonly _menuIo: MenuIoService,
  ) {}

  /**
   * Ingest an aggregator order onto the KDS. Verifies the shared secret, then
   * runs the provider's payload normalizer so each aggregator's native JSON maps
   * to the same order shape.
   */
  async handleWebhook(
    provider: string,
    token: string | undefined,
    rawBody: Record<string, unknown>,
  ): Promise<{ orderId: string; orderNumber: string }> {
    const connector = findConnector(provider);
    if (!connector?.webhookPath) {
      throw new NotFoundException('Unknown webhook');
    }
    const config = await this._integrations.getConnectedConfig(provider);
    if (!config) {
      throw new UnauthorizedException(`${connector.name} is not connected`);
    }
    const expected = typeof config.webhookToken === 'string' ? config.webhookToken : undefined;
    if (!constantTimeEqual(token, expected)) {
      throw new UnauthorizedException('Invalid webhook token');
    }

    const norm = normalizeOrder(provider, rawBody);
    if (norm.items.length === 0) {
      throw new BadRequestException('Order payload has no items');
    }

    const ref = norm.externalId ? ` #${norm.externalId}` : '';
    const note = norm.note ? ` — ${norm.note}` : '';

    const order = await this._orders.createOrder({
      orderType: 'online',
      source: provider,
      externalRef: norm.externalId,
      customerName: norm.customer.name ?? `${connector.name} customer`,
      customerPhone: norm.customer.phone,
      customerAddress: norm.customer.address,
      deliveryFee: norm.deliveryFee,
      notes: `${connector.name}${ref}${note}`,
      items: norm.items.map((it) => ({
        name: it.name,
        unitPrice: it.price,
        quantity: it.quantity,
        notes: it.notes,
      })),
    });

    await this._integrations.log({
      provider,
      direction: 'order_in',
      status: 'success',
      message: `Order ${order.orderNumber} received`,
      meta: { orderNumber: order.orderNumber, externalRef: norm.externalId, items: norm.items.length },
    });

    return { orderId: order.id, orderNumber: order.orderNumber };
  }

  /** Push our menu out to one aggregator's catalog. */
  async pushMenu(provider: string): Promise<MenuPushResult> {
    const connector = findConnector(provider);
    if (!connector?.canPushMenu) {
      throw new BadRequestException('This integration does not support menu push');
    }
    const config = await this._integrations.getLiveConfig(provider);
    if (!config) throw new BadRequestException(`${connector.name} is not connected`);

    const snapshot = await this._menuIo.snapshot();
    const target = resolveOutboundTarget(provider, config);

    let status: MenuPushResult['status'] = 'prepared';
    if (target) {
      try {
        const res = await fetch(`${target.base}/menu`, {
          method: 'POST',
          headers: targetHeaders(target),
          body: JSON.stringify(snapshot),
        });
        if (!res.ok) throw new BadRequestException(`${connector.name} returned ${res.status}`);
        status = 'sent';
      } catch (err) {
        this.logger.warn(`[${provider}] menu push failed: ${(err as Error).message}`);
        await this._integrations.log({
          provider,
          direction: 'menu_out',
          status: 'error',
          message: (err as Error).message,
          meta: { items: snapshot.items.length },
        });
        throw err instanceof BadRequestException
          ? err
          : new BadRequestException('Could not reach the menu API');
      }
    }

    await this._integrations.markSynced(provider);
    await this._integrations.log({
      provider,
      direction: 'menu_out',
      status: 'success',
      message: status === 'sent' ? 'Menu pushed' : 'Menu prepared (no live endpoint)',
      meta: { items: snapshot.items.length, categories: snapshot.categories.length },
    });
    return { items: snapshot.items.length, categories: snapshot.categories.length, status };
  }
}
