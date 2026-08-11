import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { StockItem } from './entities/stock-item.entity';
import { StockLevel } from './entities/stock-level.entity';
import { StockTake } from './entities/stock-take.entity';
import { StockTakeLine } from './entities/stock-take-line.entity';
import { InventoryService } from './inventory.service';
import { InventoryAlertService } from './services/inventory-alert.service';
import {
  CreateStockTakeDto,
  GetStockTakeQueryDto,
  UpdateStockTakeDto,
} from './dto';

@Injectable()
export class StockTakeService {
  constructor(
    @InjectRepository(StockTake)
    private readonly _takes: Repository<StockTake>,
    @InjectRepository(StockTakeLine)
    private readonly _lines: Repository<StockTakeLine>,
    @InjectRepository(StockItem)
    private readonly _items: Repository<StockItem>,
    @InjectRepository(StockLevel)
    private readonly _levels: Repository<StockLevel>,
    private readonly _pagination: PaginationProvider,
    private readonly _inventory: InventoryService,
    private readonly _alerts: InventoryAlertService,
  ) {}

  getAll(query: GetStockTakeQueryDto): Promise<Paginated<StockTake>> {
    const where: Record<string, unknown> = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status;
    return this._pagination.paginationQuery(
      query,
      this._takes,
      where,
      [],
      undefined,
      {
        createdAt: 'DESC',
      },
    );
  }

  getById(id: string): Promise<StockTake> {
    return this.ensureExists(id, ['lines', 'lines.stockItem']);
  }

  /**
   * Open a count for a branch: snapshot the current on-hand of the chosen items
   * (or every active item) into lines, with the counted quantity seeded to the
   * system figure so a line left untouched reconciles to zero variance.
   */
  async create(
    dto: CreateStockTakeDto,
    createdBy?: string | null,
  ): Promise<StockTake> {
    const items = dto.stockItemIds?.length
      ? await this._items.find({ where: { id: In(dto.stockItemIds) } })
      : await this._items.find({ where: { isActive: true } });
    if (items.length === 0) {
      throw new BadRequestException('No stock items to count.');
    }

    const levels = await this._levels.find({
      where: {
        branchId: dto.branchId,
        stockItemId: In(items.map((i) => i.id)),
      },
    });
    const qtyByItem = new Map(
      levels.map((l) => [l.stockItemId, Number(l.quantity)]),
    );

    const take = this._takes.create({
      reference: await this.nextReference(),
      branchId: dto.branchId,
      status: 'draft',
      notes: dto.notes ?? null,
      createdBy: createdBy ?? null,
      lines: items.map((item) => {
        const system = qtyByItem.get(item.id) ?? 0;
        return this._lines.create({
          stockItemId: item.id,
          systemQty: system,
          countedQty: system,
        });
      }),
    });
    const saved = await this._takes.save(take);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateStockTakeDto): Promise<StockTake> {
    const take = await this.ensureExists(id, ['lines']);
    if (take.status !== 'draft') {
      throw new BadRequestException('Only a draft stock take can be edited.');
    }

    if (dto.notes !== undefined) {
      take.notes = dto.notes || null;
      await this._takes.save(take);
    }
    if (dto.lines?.length) {
      const byItem = new Map(take.lines.map((l) => [l.stockItemId, l]));
      const updates = dto.lines
        .map((input) => {
          const line = byItem.get(input.stockItemId);
          if (!line) return null;
          line.countedQty = input.countedQty;
          return line;
        })
        .filter((l): l is StockTakeLine => l !== null);
      if (updates.length) await this._lines.save(updates);
    }
    return this.getById(id);
  }

  /**
   * Reconcile the count: for each line with a non-zero variance, post an
   * `adjustment` movement to bring on-hand to the counted figure, then re-check
   * alerts. Idempotent — a completed/cancelled take can't be completed again.
   */
  async complete(id: string, createdBy?: string | null): Promise<StockTake> {
    const take = await this.ensureExists(id, ['lines']);
    if (take.status !== 'draft') {
      throw new BadRequestException('This stock take is already closed.');
    }

    const touched: string[] = [];
    for (const line of take.lines) {
      const variance = Number(line.countedQty) - Number(line.systemQty);
      if (variance === 0) continue;
      await this._inventory.applyDelta(
        line.stockItemId,
        take.branchId,
        variance,
        'adjustment',
        {
          note: `Stock take ${take.reference}`,
          createdBy: createdBy ?? null,
        },
      );
      touched.push(line.stockItemId);
    }
    for (const stockItemId of touched) {
      await this._alerts.evaluate(stockItemId, take.branchId);
    }

    take.status = 'completed';
    take.completedAt = new Date();
    await this._takes.save(take);
    return this.getById(id);
  }

  async cancel(id: string): Promise<StockTake> {
    const take = await this.ensureExists(id);
    if (take.status === 'completed') {
      throw new BadRequestException(
        'A completed stock take cannot be cancelled.',
      );
    }
    take.status = 'cancelled';
    await this._takes.save(take);
    return this.getById(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const take = await this.ensureExists(id);
    if (take.status === 'completed') {
      throw new BadRequestException(
        'A completed stock take cannot be deleted.',
      );
    }
    await this._takes.delete(id);
    return { message: 'Stock take deleted successfully.' };
  }

  private async nextReference(): Promise<string> {
    const count = await this._takes.count();
    return `ST-${String(count + 1).padStart(5, '0')}`;
  }

  private async ensureExists(
    id: string,
    relations: string[] = [],
  ): Promise<StockTake> {
    const take = await this._takes.findOne({ where: { id }, relations });
    if (!take) throw new NotFoundException('Stock take not found.');
    return take;
  }
}
