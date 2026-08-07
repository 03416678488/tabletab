import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { QrCode } from './entities/qr-code.entity';
import { QrCodeValidatorService } from './services/qr-code-validator.service';
import { QrCodeHelperService } from './services/qr-code.helper.service';
import { CreateQrCodeDto, UpdateQrCodeDto, GetQrCodeQueryDto } from './dto';
import { OrderService } from '@modules/order/order.service';
import { Order } from '@modules/order/entities/order.entity';
import { ServiceRequestService } from '@modules/service-request/service-request.service';

/** Main QR-code flow only — validation + normalization live in the sibling services. */
@Injectable()
export class QrCodeService extends AbstractService<QrCode> {
  constructor(
    @InjectRepository(QrCode)
    protected readonly repository: Repository<QrCode>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: QrCodeValidatorService,
    private readonly _helper: QrCodeHelperService,
    private readonly _orders: OrderService,
    private readonly _serviceRequests: ServiceRequestService,
  ) {
    super(repository, pagination);
  }

  /** The table's current open order (the bill), or null when nothing is running. */
  async getBill(slug: string): Promise<Order | null> {
    const qr = await this.resolveBySlug(slug);
    return this._orders.getActiveByTable(qr.tableId);
  }

  /** Queue a service request from the table — lands live on the staff board + bell. */
  private async requestService(slug: string, type: 'waiter' | 'bill'): Promise<void> {
    const qr = await this.resolveBySlug(slug);
    await this._serviceRequests.create({
      type,
      tableId: qr.tableId,
      tableName: qr.table?.name ?? null,
      branchId: qr.table?.branchId ?? null,
    });
  }

  /** A guest tapped "Call waiter" — queue it for staff. */
  async callWaiter(slug: string): Promise<{ message: string }> {
    await this.requestService(slug, 'waiter');
    return { message: 'A waiter has been notified — someone will be with you shortly.' };
  }

  /** A guest is ready to pay — queue a bill request for staff. */
  async requestBill(slug: string): Promise<{ message: string }> {
    await this.requestService(slug, 'bill');
    return { message: 'Staff have been notified — someone will bring your bill.' };
  }

  getAll(query: GetQrCodeQueryDto): Promise<Paginated<QrCode>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [
      'table',
      'table.area',
      'table.branch',
    ]);
  }

  getById(id: string): Promise<QrCode> {
    return this._validator.ensureExists(id);
  }

  /**
   * Public scan resolution: map a QR `slug` to its active table + branch so the
   * customer storefront can start a dine-in session. Slugs are globally unique.
   */
  async resolveBySlug(slug: string): Promise<QrCode> {
    const qr = await this.repository.findOne({
      where: { slug, isActive: true },
      relations: ['table', 'table.area', 'table.branch'],
    });
    if (!qr) {
      throw new NotFoundException('This QR code is not active or no longer exists.');
    }
    return qr;
  }

  async createQrCode(dto: CreateQrCodeDto): Promise<QrCode> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    return this.getById(saved.id);
  }

  async updateQrCode(id: string, dto: UpdateQrCodeDto): Promise<QrCode> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteQrCode(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
