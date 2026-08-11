import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';

import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { escapeLikePattern } from '@cor/helpers/query.helper';

import { StockItem } from './entities/stock-item.entity';
import { StockLevel } from './entities/stock-level.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { InventoryAlertService } from './services/inventory-alert.service';
import {
  AdjustStockDto,
  CreateStockItemDto,
  GetStockItemQueryDto,
  UpdateStockItemDto,
} from './dto';

/** A stock item plus its on-hand quantity at a queried branch. */
export type StockItemWithLevel = StockItem & { quantity?: number };

/** Core inventory flow — catalogue CRUD, per-branch levels and the ledger. */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockItem)
    private readonly _items: Repository<StockItem>,
    @InjectRepository(StockLevel)
    private readonly _levels: Repository<StockLevel>,
    @InjectRepository(StockMovement)
    private readonly _movements: Repository<StockMovement>,
    private readonly _pagination: PaginationProvider,
    private readonly _alerts: InventoryAlertService,
  ) {}

  // ---- Catalogue ---------------------------------------------------------

  async getAll(
    query: GetStockItemQueryDto,
  ): Promise<Paginated<StockItemWithLevel>> {
    const where: Record<string, unknown> = {};
    if (query.search)
      where.name = ILike(`%${escapeLikePattern(query.search)}%`);
    if (query.isActive !== undefined)
      where.isActive = query.isActive === 'true';

    // Restrict to low-stock items at the given branch (needs a branch context).
    if (query.lowStock === 'true' && query.branchId) {
      const lowIds = await this.lowStockItemIds(query.branchId);
      where.id = lowIds.length
        ? In(lowIds)
        : In(['00000000-0000-0000-0000-000000000000']);
    }

    const page = await this._pagination.paginationQuery(
      query,
      this._items,
      where,
      [],
      undefined,
      { name: 'ASC' },
    );

    if (query.branchId) {
      const levels = await this._levels.find({
        where: {
          branchId: query.branchId,
          stockItemId: In(page.items.map((i) => i.id)),
        },
      });
      const byItem = new Map(
        levels.map((l) => [l.stockItemId, Number(l.quantity)]),
      );
      page.items = page.items.map((i) => {
        (i as StockItemWithLevel).quantity = byItem.get(i.id) ?? 0;
        return i;
      });
    }
    return page as Paginated<StockItemWithLevel>;
  }

  getById(id: string): Promise<StockItem> {
    return this.ensureExists(id);
  }

  create(dto: CreateStockItemDto): Promise<StockItem> {
    return this._items.save(this._items.create(dto));
  }

  async update(id: string, dto: UpdateStockItemDto): Promise<StockItem> {
    await this.ensureExists(id);
    await this._items.update(id, dto);
    return this.ensureExists(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.ensureExists(id);
    // Levels + movements cascade via FK; recipe lines referencing it too.
    await this._items.delete(id);
    return { message: 'Stock item deleted successfully.' };
  }

  // ---- Levels + ledger ---------------------------------------------------

  /** On-hand rows for a branch (for a stock-levels dashboard). */
  levelsForBranch(branchId: string): Promise<StockLevel[]> {
    return this._levels.find({
      where: { branchId },
      relations: ['stockItem'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Recent ledger entries, newest first — optional item/branch filter. */
  getMovements(
    query: GetStockItemQueryDto & { stockItemId?: string },
  ): Promise<Paginated<StockMovement>> {
    const where: Record<string, unknown> = {};
    if (query.stockItemId) where.stockItemId = query.stockItemId;
    if (query.branchId) where.branchId = query.branchId;
    return this._pagination.paginationQuery(
      query,
      this._movements,
      where,
      [],
      undefined,
      {
        createdAt: 'DESC',
      },
    );
  }

  /**
   * Apply a manual stock change (purchase in, waste out, count correction,
   * transfer) — writes the ledger row, moves the level (may go negative), then
   * re-checks alerts. `delta` is signed; direction is derived from its sign.
   */
  async adjust(
    dto: AdjustStockDto,
    createdBy?: string | null,
  ): Promise<StockLevel> {
    const item = await this.ensureExists(dto.stockItemId);
    const level = await this.applyDelta(
      item.id,
      dto.branchId,
      dto.delta,
      dto.type,
      { note: dto.note ?? null, createdBy: createdBy ?? null },
    );
    await this._alerts.evaluate(item.id, dto.branchId);
    return level;
  }

  /**
   * Move a stock level by `delta` and record the matching ledger row. Shared by
   * manual adjustments and order-driven deduction. Does NOT run alerts — the
   * caller decides when to evaluate (once per item, after all lines applied).
   */
  async applyDelta(
    stockItemId: string,
    branchId: string,
    delta: number,
    type: StockMovement['type'],
    extra: {
      orderId?: string | null;
      note?: string | null;
      createdBy?: string | null;
    } = {},
  ): Promise<StockLevel> {
    let level = await this._levels.findOne({
      where: { stockItemId, branchId },
    });
    if (!level) {
      level = this._levels.create({ stockItemId, branchId, quantity: 0 });
    }
    level.quantity = Number(level.quantity) + delta;
    const saved = await this._levels.save(level);

    await this._movements.save(
      this._movements.create({
        stockItemId,
        branchId,
        type,
        direction: delta >= 0 ? 'in' : 'out',
        quantity: Math.abs(delta),
        orderId: extra.orderId ?? null,
        note: extra.note ?? null,
        createdBy: extra.createdBy ?? null,
      }),
    );
    return saved;
  }

  private async ensureExists(id: string): Promise<StockItem> {
    const item = await this._items.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Stock item not found.');
    return item;
  }

  /** Item ids at/below their reorder level for a branch. */
  private async lowStockItemIds(branchId: string): Promise<string[]> {
    const rows = await this._levels
      .createQueryBuilder('lvl')
      .innerJoin(StockItem, 'item', 'item.id = lvl."stockItemId"')
      .where('lvl."branchId" = :branchId', { branchId })
      .andWhere('lvl.quantity <= item."reorderLevel"')
      .select('lvl."stockItemId"', 'stockItemId')
      .getRawMany<{ stockItemId: string }>();
    return rows.map((r) => r.stockItemId);
  }
}
