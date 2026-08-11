import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { StockItem } from './entities/stock-item.entity';
import { StockLevel } from './entities/stock-level.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { GetInventoryReportQueryDto } from './dto';

export interface InventoryReport {
  stockValue: number;
  itemCount: number;
  lowStockCount: number;
  period: {
    from: string | null;
    to: string | null;
    consumptionValue: number;
    consumptionQty: number;
    wastageValue: number;
    wastageQty: number;
    purchaseValue: number;
  };
  topConsumed: {
    stockItemId: string;
    name: string;
    unit: string;
    qty: number;
    value: number;
  }[];
}

const num = (v: unknown): number => Number(v ?? 0) || 0;

/** Read-only inventory analytics: valuation, consumption (COGS), wastage. */
@Injectable()
export class InventoryReportService {
  constructor(
    @InjectRepository(StockLevel)
    private readonly _levels: Repository<StockLevel>,
    @InjectRepository(StockMovement)
    private readonly _movements: Repository<StockMovement>,
  ) {}

  async getReport(query: GetInventoryReportQueryDto): Promise<InventoryReport> {
    const [valuation, byType, topConsumed] = await Promise.all([
      this.valuation(query.branchId),
      this.movementsByType(query),
      this.topConsumed(query),
    ]);

    const sale = byType.get('sale');
    const waste = byType.get('waste');
    const purchase = byType.get('purchase');

    return {
      stockValue: valuation.stockValue,
      itemCount: valuation.itemCount,
      lowStockCount: valuation.lowStockCount,
      period: {
        from: query.from ?? null,
        to: query.to ?? null,
        consumptionValue: num(sale?.value),
        consumptionQty: num(sale?.qty),
        wastageValue: num(waste?.value),
        wastageQty: num(waste?.qty),
        purchaseValue: num(purchase?.value),
      },
      topConsumed,
    };
  }

  /** Current on-hand value + item/low counts (a live snapshot, no date window). */
  private async valuation(branchId?: string) {
    const qb = this._levels
      .createQueryBuilder('lvl')
      .innerJoin(StockItem, 'item', 'item.id = lvl."stockItemId"')
      .select(
        'COALESCE(SUM(lvl.quantity * item."costPerUnit"), 0)',
        'stockValue',
      )
      .addSelect('COUNT(DISTINCT lvl."stockItemId")', 'itemCount')
      .addSelect(
        'COUNT(*) FILTER (WHERE lvl.quantity <= item."reorderLevel")',
        'lowStockCount',
      );
    if (branchId) qb.where('lvl."branchId" = :branchId', { branchId });

    const row = await qb.getRawOne<{
      stockValue: string;
      itemCount: string;
      lowStockCount: string;
    }>();
    return {
      stockValue: num(row?.stockValue),
      itemCount: num(row?.itemCount),
      lowStockCount: num(row?.lowStockCount),
    };
  }

  /** Sum of quantity + value (qty × current cost) per movement type in window. */
  private async movementsByType(query: GetInventoryReportQueryDto) {
    const qb = this._movements
      .createQueryBuilder('m')
      .innerJoin(StockItem, 'item', 'item.id = m."stockItemId"')
      .select('m.type', 'type')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'qty')
      .addSelect('COALESCE(SUM(m.quantity * item."costPerUnit"), 0)', 'value')
      .groupBy('m.type');
    this.applyScope(qb, query);

    const rows = await qb.getRawMany<{
      type: string;
      qty: string;
      value: string;
    }>();
    return new Map(
      rows.map((r) => [r.type, { qty: num(r.qty), value: num(r.value) }]),
    );
  }

  /** Top stock items by quantity consumed (sale movements) in the window. */
  private async topConsumed(query: GetInventoryReportQueryDto) {
    const qb = this._movements
      .createQueryBuilder('m')
      .innerJoin(StockItem, 'item', 'item.id = m."stockItemId"')
      .select('m."stockItemId"', 'stockItemId')
      .addSelect('item.name', 'name')
      .addSelect('item.unit', 'unit')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'qty')
      .addSelect('COALESCE(SUM(m.quantity * item."costPerUnit"), 0)', 'value')
      .where("m.type = 'sale'")
      .groupBy('m."stockItemId"')
      .addGroupBy('item.name')
      .addGroupBy('item.unit')
      .orderBy('qty', 'DESC')
      .limit(5);
    this.applyScope(qb, query);

    const rows = await qb.getRawMany<{
      stockItemId: string;
      name: string;
      unit: string;
      qty: string;
      value: string;
    }>();
    return rows.map((r) => ({
      stockItemId: r.stockItemId,
      name: r.name,
      unit: r.unit,
      qty: num(r.qty),
      value: num(r.value),
    }));
  }

  /**
   * Apply branch + date-window conditions shared by the movement queries.
   * `andWhere` acts as the first WHERE when none is set yet, so it composes with
   * queries that already have a base condition (e.g. type = 'sale').
   */
  private applyScope(
    qb: SelectQueryBuilder<StockMovement>,
    query: GetInventoryReportQueryDto,
  ): void {
    if (query.branchId)
      qb.andWhere('m."branchId" = :branchId', { branchId: query.branchId });
    if (query.from) qb.andWhere('m."createdAt" >= :from', { from: query.from });
    if (query.to) qb.andWhere('m."createdAt" <= :to', { to: query.to });
  }
}
