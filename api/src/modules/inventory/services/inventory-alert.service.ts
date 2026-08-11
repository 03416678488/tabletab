import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { menuChannel } from '@modules/realtime/channels';
import { NotificationService } from '@modules/notification/notification.service';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';

import { StockItem } from '../entities/stock-item.entity';
import { StockLevel } from '../entities/stock-level.entity';
import { RecipeLine } from '../entities/recipe-line.entity';

/** Managers who should hear about stock running low. */
const ALERT_ROLES = ['Owner', 'Multi Branch Manager', 'Branch Manager'];

/**
 * Reacts to a stock level crossing a threshold: fires a low-stock notification
 * to managers and, when an item hits zero, marks every menu item that depends
 * on it sold-out (nudging the storefront/POS to reconcile). Negative stock is
 * allowed — this only alerts, it never blocks a sale.
 */
@Injectable()
export class InventoryAlertService {
  constructor(
    @InjectRepository(StockItem)
    private readonly _items: Repository<StockItem>,
    @InjectRepository(StockLevel)
    private readonly _levels: Repository<StockLevel>,
    @InjectRepository(RecipeLine)
    private readonly _recipeLines: Repository<RecipeLine>,
    @InjectRepository(MenuItem)
    private readonly _menuItems: Repository<MenuItem>,
    private readonly _notifications: NotificationService,
    private readonly _realtime: RealtimeService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {}

  /**
   * Re-evaluate one item's level at a branch after a change. Alerts when it is
   * at/below its reorder threshold; when it reaches zero (or below), flips the
   * dependent menu items sold-out. Best-effort — never throws into the caller.
   */
  async evaluate(stockItemId: string, branchId: string): Promise<void> {
    try {
      const [item, level] = await Promise.all([
        this._items.findOne({ where: { id: stockItemId } }),
        this._levels.findOne({ where: { stockItemId, branchId } }),
      ]);
      if (!item || !level) return;

      const qty = Number(level.quantity);
      const reorder = Number(item.reorderLevel);

      if (qty <= 0) {
        await this.disableDependents(stockItemId);
      }

      if (qty <= reorder) {
        await this._notifications.notifyRoles(ALERT_ROLES, {
          category: 'inventory',
          type: qty <= 0 ? 'stock.out' : 'stock.low',
          title:
            qty <= 0
              ? `${item.name} is out of stock`
              : `${item.name} is running low`,
          body: `On hand: ${qty} ${item.unit} (reorder at ${reorder}).`,
          data: { stockItemId, branchId, quantity: qty },
          priority: qty <= 0 ? 'high' : 'normal',
          branchId,
        });
      }
    } catch {
      // Alerting is advisory; a failure here must not roll back the sale/adjust.
    }
  }

  /** Mark every menu item that consumes this stock item as unavailable. */
  private async disableDependents(stockItemId: string): Promise<void> {
    const recipeLines = await this._recipeLines.find({
      where: { stockItemId },
      select: { menuItemId: true },
    });
    const dependentIds = new Set<string>(recipeLines.map((l) => l.menuItemId));

    // Unit-tracked items point at the stock item directly.
    const unitItems = await this._menuItems.find({
      where: { stockItemId },
      select: { id: true },
    });
    unitItems.forEach((m) => dependentIds.add(m.id));

    const ids = [...dependentIds];
    if (ids.length === 0) return;

    await this._menuItems.update(
      { id: In(ids), isAvailable: true },
      { isAvailable: false },
    );
    // Nudge storefront/POS to reconcile availability.
    ids.forEach((id) =>
      this._realtime.publish(
        menuChannel(this._req.tenant?.id),
        'menu.changed',
        {
          id,
        },
      ),
    );
  }
}
