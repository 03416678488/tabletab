import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Table } from '@modules/table/entities/table.entity';

import { QrCode } from './entities/qr-code.entity';
import { QrCodeValidatorService } from './services/qr-code-validator.service';
import { QrCodeHelperService } from './services/qr-code.helper.service';
import { CreateQrCodeDto, UpdateQrCodeDto, GetQrCodeQueryDto } from './dto';
import { CreateTableOrderDto } from './dto/create-table-order.dto';
import { OrderService } from '@modules/order/order.service';
import { Order } from '@modules/order/entities/order.entity';
import { ServiceRequestService } from '@modules/service-request/service-request.service';
import { TableSessionService } from './table-session.service';

/**
 * Idempotency store for guest dine-in submits — module-level so it survives the
 * request-scoped service instances. A repeated `idempotencyKey` (double-tap,
 * network retry) within the TTL returns the original order id instead of
 * creating a duplicate. (Single-instance in-memory; a multi-instance deployment
 * would back this with Redis — noted as a follow-up.)
 */
const IDEMPOTENCY_TTL_MS = 60_000;
const recentSubmits = new Map<
  string,
  { orderId: string; sessionToken: string; at: number }
>();
function rememberSubmit(
  key: string,
  orderId: string,
  sessionToken: string,
): void {
  const now = Date.now();
  for (const [k, v] of recentSubmits) {
    if (now - v.at > IDEMPOTENCY_TTL_MS) recentSubmits.delete(k);
  }
  recentSubmits.set(key, { orderId, sessionToken, at: now });
}

/** Main QR-code flow only — validation + normalization live in the sibling services. */
@Injectable()
export class QrCodeService extends AbstractService<QrCode> {
  constructor(
    @InjectRepository(QrCode)
    protected readonly repository: Repository<QrCode>,
    @InjectRepository(Table)
    private readonly _tables: Repository<Table>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: QrCodeValidatorService,
    private readonly _helper: QrCodeHelperService,
    private readonly _orders: OrderService,
    private readonly _serviceRequests: ServiceRequestService,
    private readonly _tableSessions: TableSessionService,
  ) {
    super(repository, pagination);
  }

  /**
   * Place a dine-in order from a scanned table QR. Security-critical: the table
   * and branch come from the QR (`resolveBySlug`), never the request body, so a
   * guest can't order to another table or branch. The order runs through the
   * normal (untrusted) create path — items re-priced against the live menu,
   * `paymentStatus` forced to `unpaid`. A duplicate `idempotencyKey` returns the
   * original order instead of creating a second one.
   */
  async createTableOrder(
    slug: string,
    dto: CreateTableOrderDto,
  ): Promise<{ order: Order; sessionToken: string }> {
    const key = dto.idempotencyKey?.trim();
    if (key) {
      const hit = recentSubmits.get(key);
      if (hit && Date.now() - hit.at < IDEMPOTENCY_TTL_MS) {
        return {
          order: await this._orders.getById(hit.orderId),
          sessionToken: hit.sessionToken,
        };
      }
    }

    const qr = await this.resolveBySlug(slug);
    const table = qr.table;
    if (!table || table.isActive === false) {
      throw new BadRequestException(
        'This table is not available for ordering right now.',
      );
    }
    if (table.branch && table.branch.isOpen === false) {
      throw new BadRequestException('This location is currently closed.');
    }

    // Gate ordering on the per-sitting token: a stale token (previous sitting)
    // is rejected here, so a past customer's saved link can't add to the bill.
    const session = await this._tableSessions.resolveForOrder(
      table.id,
      table.branchId ?? null,
      dto.sessionToken,
    );

    // Per-branch payment timing: prepay ('pay_first') holds the order in
    // `pending_payment` (off the kitchen board / not occupying the table) until
    // the gateway confirms; 'pay_after' (default) goes straight to the kitchen.
    const prepay = table.branch?.dineInPaymentMode === 'pay_first';

    const order = await this._orders.createOrder(
      {
        orderType: 'table',
        tableId: table.id,
        branchId: table.branchId ?? undefined,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        promotionCode: dto.promotionCode,
        items: dto.items,
      },
      undefined,
      { initialStatus: prepay ? 'pending_payment' : 'placed' },
    );

    await this._tableSessions.touch(session.id);
    if (key) rememberSubmit(key, order.id, session.token);
    return { order, sessionToken: session.token };
  }

  /** Queue a service request from the table — lands live on the staff board + bell. */
  private async requestService(
    slug: string,
    type: 'waiter' | 'bill',
  ): Promise<void> {
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
    return {
      message: 'A waiter has been notified — someone will be with you shortly.',
    };
  }

  async getAll(query: GetQrCodeQueryDto): Promise<Paginated<QrCode>> {
    // Every table gets a scannable code automatically — materialize any that
    // are missing before listing, so the admin never has to create table codes
    // by hand (custom codes are still user-created).
    await this.ensureTableCodes();
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [
      'table',
      'table.area',
      'table.branch',
    ]);
  }

  /**
   * Create a table-kind QR for any table that doesn't have one yet. Idempotent
   * and safe to call on every list — it only inserts the gaps. A unique-index
   * clash (a concurrent insert) is swallowed, since the row now exists either
   * way.
   */
  private async ensureTableCodes(): Promise<void> {
    const [tables, existing] = await Promise.all([
      this._tables.find({ select: { id: true } }),
      this.repository.find({
        where: { kind: 'table' },
        select: { tableId: true },
      }),
    ]);
    const covered = new Set(existing.map((q) => q.tableId));
    const missing = tables.filter((t) => !covered.has(t.id));
    if (missing.length === 0) return;

    for (const table of missing) {
      try {
        await this.repository.save(
          this.repository.create({
            kind: 'table',
            tableId: table.id,
            isActive: true,
            slug: this._helper.generateSlug(),
          }),
        );
      } catch {
        // Another request already created it — the code exists, move on.
      }
    }
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
      throw new NotFoundException(
        'This QR code is not active or no longer exists.',
      );
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
