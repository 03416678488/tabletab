import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { OrderItem } from '@modules/order/entities/order-item.entity';

import { StockMovement } from './entities/stock-movement.entity';
import { RecipeLine } from './entities/recipe-line.entity';
import { InventoryService } from './inventory.service';
import { InventoryAlertService } from './services/inventory-alert.service';

/** One stock draw-down computed from an order line. */
interface Consumption {
  stockItemId: string;
  quantity: number;
}

/**
 * Turns a confirmed order into stock movements (and reverses them on cancel).
 * Recipe-tracked lines expand into their ingredients; unit-tracked lines draw
 * one unit of their own stock item; untracked lines are ignored. Idempotent per
 * order via the sale/restock rows already in the ledger.
 */
@Injectable()
export class InventoryDeductionService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly _orderItems: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private readonly _menuItems: Repository<MenuItem>,
    @InjectRepository(RecipeLine)
    private readonly _recipeLines: Repository<RecipeLine>,
    @InjectRepository(StockMovement)
    private readonly _movements: Repository<StockMovement>,
    private readonly _inventory: InventoryService,
    private readonly _alerts: InventoryAlertService,
  ) {}

  /**
   * Deduct stock for a newly-confirmed order at `branchId`. No-op if it was
   * already deducted (a sale row exists) or the branch is unknown. Best-effort:
   * a failure is swallowed so it never rolls back the order status change.
   */
  async applyOrderConfirmed(
    orderId: string,
    branchId: string | null,
  ): Promise<void> {
    try {
      if (!branchId) return;
      if (await this.hasMovement(orderId, 'sale')) return;

      const consumption = await this.consumptionForOrder(orderId);
      for (const c of consumption) {
        await this._inventory.applyDelta(
          c.stockItemId,
          branchId,
          -c.quantity,
          'sale',
          {
            orderId,
          },
        );
      }
      await this.evaluateAll(consumption, branchId);
    } catch {
      // Deduction is best-effort; stock can be reconciled via a stock take.
    }
  }

  /**
   * Put stock back for a cancelled order. No-op unless it had been deducted and
   * not already restocked. Mirrors {@link applyOrderConfirmed} in reverse.
   */
  async reverseOrderCancelled(
    orderId: string,
    branchId: string | null,
  ): Promise<void> {
    try {
      if (!branchId) return;
      if (!(await this.hasMovement(orderId, 'sale'))) return;
      if (await this.hasMovement(orderId, 'restock')) return;

      const consumption = await this.consumptionForOrder(orderId);
      for (const c of consumption) {
        await this._inventory.applyDelta(
          c.stockItemId,
          branchId,
          c.quantity,
          'restock',
          {
            orderId,
            note: 'Order cancelled',
          },
        );
      }
      await this.evaluateAll(consumption, branchId);
    } catch {
      // Best-effort — see applyOrderConfirmed.
    }
  }

  // ---- internals ---------------------------------------------------------

  /** Sum the stock each order line consumes, merged per stock item. */
  private async consumptionForOrder(orderId: string): Promise<Consumption[]> {
    const lines = await this._orderItems.find({ where: { orderId } });
    const menuItemIds = [
      ...new Set(lines.map((l) => l.menuItemId).filter(Boolean)),
    ] as string[];
    if (menuItemIds.length === 0) return [];

    const [items, recipeLines] = await Promise.all([
      this._menuItems.find({ where: { id: In(menuItemIds) } }),
      this._recipeLines.find({ where: { menuItemId: In(menuItemIds) } }),
    ]);
    const itemById = new Map(items.map((i) => [i.id, i]));
    const recipeByItem = new Map<string, RecipeLine[]>();
    for (const rl of recipeLines) {
      const list = recipeByItem.get(rl.menuItemId) ?? [];
      list.push(rl);
      recipeByItem.set(rl.menuItemId, list);
    }

    const totals = new Map<string, number>();
    const add = (stockItemId: string, qty: number) =>
      totals.set(stockItemId, (totals.get(stockItemId) ?? 0) + qty);

    for (const line of lines) {
      if (!line.menuItemId) continue;
      const item = itemById.get(line.menuItemId);
      if (!item) continue;
      const orderQty = Number(line.quantity) || 0;

      if (item.trackingType === 'unit' && item.stockItemId) {
        add(item.stockItemId, orderQty);
      } else if (item.trackingType === 'recipe') {
        for (const rl of recipeByItem.get(item.id) ?? []) {
          add(rl.stockItemId, Number(rl.quantity) * orderQty);
        }
      }
    }

    return [...totals.entries()].map(([stockItemId, quantity]) => ({
      stockItemId,
      quantity,
    }));
  }

  private async hasMovement(
    orderId: string,
    type: StockMovement['type'],
  ): Promise<boolean> {
    const count = await this._movements.count({ where: { orderId, type } });
    return count > 0;
  }

  private async evaluateAll(
    consumption: Consumption[],
    branchId: string,
  ): Promise<void> {
    for (const c of consumption) {
      await this._alerts.evaluate(c.stockItemId, branchId);
    }
  }
}
