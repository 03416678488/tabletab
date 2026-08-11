import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { escapeLikePattern } from '@cor/helpers/query.helper';
import { InventoryService } from '@modules/inventory/inventory.service';

import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import {
  CreatePurchaseOrderDto,
  GetPurchaseOrderQueryDto,
  PurchaseOrderLineInput,
  UpdatePurchaseOrderDto,
} from './dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly _pos: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderLine)
    private readonly _lines: Repository<PurchaseOrderLine>,
    private readonly _pagination: PaginationProvider,
    private readonly _inventory: InventoryService,
  ) {}

  getAll(query: GetPurchaseOrderQueryDto): Promise<Paginated<PurchaseOrder>> {
    const where: Record<string, unknown> = {};
    if (query.search)
      where.reference = ILike(`%${escapeLikePattern(query.search)}%`);
    if (query.branchId) where.branchId = query.branchId;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.status) where.status = query.status;
    return this._pagination.paginationQuery(
      query,
      this._pos,
      where,
      ['supplier'],
      undefined,
      { createdAt: 'DESC' },
    );
  }

  getById(id: string): Promise<PurchaseOrder> {
    return this.ensureExists(id, ['supplier', 'lines', 'lines.stockItem']);
  }

  async create(
    dto: CreatePurchaseOrderDto,
    createdBy?: string | null,
  ): Promise<PurchaseOrder> {
    const lines = this.buildLines(dto.lines);
    const total = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
    const status = dto.status ?? 'draft';

    const po = this._pos.create({
      reference: await this.nextReference(),
      branchId: dto.branchId,
      supplierId: dto.supplierId ?? null,
      status,
      total,
      notes: dto.notes ?? null,
      orderedAt: status === 'ordered' ? new Date() : null,
      createdBy: createdBy ?? null,
      lines: lines.map((l) => this._lines.create(l)),
    });
    const saved = await this._pos.save(po);
    return this.getById(saved.id);
  }

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const po = await this.ensureExists(id);
    if (po.status !== 'draft') {
      throw new BadRequestException(
        'Only draft purchase orders can be edited.',
      );
    }

    if (dto.lines) {
      // Replace the lines wholesale and recompute the total.
      await this._lines.delete({ purchaseOrderId: id });
      const lines = this.buildLines(dto.lines).map((l) =>
        this._lines.create({ ...l, purchaseOrderId: id }),
      );
      await this._lines.save(lines);
      po.total = round2(lines.reduce((s, l) => s + Number(l.lineTotal), 0));
    }

    if (dto.supplierId !== undefined) po.supplierId = dto.supplierId ?? null;
    if (dto.notes !== undefined) po.notes = dto.notes || null;
    if (dto.status === 'ordered') {
      po.status = 'ordered';
      po.orderedAt = po.orderedAt ?? new Date();
    }
    await this._pos.save(po);
    return this.getById(id);
  }

  /**
   * Receive a delivery: increment each line's stock item at the PO's branch and
   * mark the order received. Only a draft/ordered PO can be received; doing so
   * again is rejected so stock is never double-counted.
   */
  async receive(id: string, createdBy?: string | null): Promise<PurchaseOrder> {
    const po = await this.ensureExists(id, ['lines']);
    if (po.status === 'received') {
      throw new BadRequestException(
        'This purchase order has already been received.',
      );
    }
    if (po.status === 'cancelled') {
      throw new BadRequestException(
        'A cancelled purchase order cannot be received.',
      );
    }

    for (const line of po.lines) {
      await this._inventory.applyDelta(
        line.stockItemId,
        po.branchId,
        Number(line.quantity),
        'purchase',
        { note: po.reference, createdBy: createdBy ?? null },
      );
    }

    po.status = 'received';
    po.receivedAt = new Date();
    await this._pos.save(po);
    return this.getById(id);
  }

  async cancel(id: string): Promise<PurchaseOrder> {
    const po = await this.ensureExists(id);
    if (po.status === 'received') {
      throw new BadRequestException(
        'A received purchase order cannot be cancelled.',
      );
    }
    po.status = 'cancelled';
    await this._pos.save(po);
    return this.getById(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const po = await this.ensureExists(id);
    if (po.status === 'received') {
      throw new BadRequestException(
        'A received purchase order cannot be deleted (it moved stock).',
      );
    }
    await this._pos.delete(id); // lines cascade
    return { message: 'Purchase order deleted successfully.' };
  }

  // ---- internals ---------------------------------------------------------

  private buildLines(inputs: PurchaseOrderLineInput[]) {
    return inputs.map((l) => ({
      stockItemId: l.stockItemId,
      quantity: l.quantity,
      unitCost: l.unitCost,
      lineTotal: round2((Number(l.quantity) || 0) * (Number(l.unitCost) || 0)),
    }));
  }

  /** Sequential-ish human reference, e.g. "PO-00042". */
  private async nextReference(): Promise<string> {
    const count = await this._pos.count();
    return `PO-${String(count + 1).padStart(5, '0')}`;
  }

  private async ensureExists(
    id: string,
    relations: string[] = [],
  ): Promise<PurchaseOrder> {
    const po = await this._pos.findOne({ where: { id }, relations });
    if (!po) throw new NotFoundException('Purchase order not found.');
    return po;
  }
}
