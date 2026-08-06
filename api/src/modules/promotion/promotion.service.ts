import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Promotion } from './entities/promotion.entity';
import { PromotionRedemption } from './entities/promotion-redemption.entity';
import { PromotionHelperService } from './services/promotion.helper.service';
import { PromotionValidatorService } from './services/promotion.validator.service';
import { toILikeContains } from '@cor/helpers/query.helper';
import {
  CreatePromotionDto,
  GetPromotionQueryDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
} from './dto';

export interface ValidatePromotionResult {
  valid: boolean;
  reason?: string;
  discountAmount: number;
  promotion?: Promotion;
}

@Injectable()
export class PromotionService extends AbstractService<Promotion> {
  constructor(
    @InjectRepository(Promotion)
    protected readonly repository: Repository<Promotion>,
    @InjectRepository(PromotionRedemption)
    private readonly redemptions: Repository<PromotionRedemption>,
    protected readonly pagination: PaginationProvider,
    private readonly _helper: PromotionHelperService,
    private readonly _validator: PromotionValidatorService,
  ) {
    super(repository, pagination);
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────

  getAll(query: GetPromotionQueryDto): Promise<Paginated<Promotion>> {
    const where: FindOptionsWhere<Promotion> = {};
    if (query.active !== undefined) where.active = query.active === 'true';
    if (query.search) where.title = toILikeContains(query.search);
    return this.pagination.paginationQuery(query, this.repository, where, undefined, undefined, {
      createdAt: 'DESC',
    });
  }

  getById(id: string): Promise<Promotion> {
    return this._validator.ensureExists(id);
  }

  async createPromotion(dto: CreatePromotionDto): Promise<Promotion> {
    const payload = this._helper.resolveCreatePayload(dto);
    await this._validator.ensureUniqueSlug(payload.slug!);
    await this._validator.ensureUniqueCode(payload.code);
    return this.create(payload);
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    await this._validator.ensureExists(id);
    const payload = this._helper.resolveUpdatePayload(dto);
    if (payload.slug) await this._validator.ensureUniqueSlug(payload.slug, id);
    if (payload.code) await this._validator.ensureUniqueCode(payload.code, id);
    await this.repository.update(id, payload);
    return this.getById(id);
  }

  deletePromotion(id: string) {
    return this.delete(id);
  }

  // ── Public storefront ───────────────────────────────────────────────────────

  /** Live promotions (active + within window), newest first. */
  async getActive(): Promise<Promotion[]> {
    const all = await this.repository.find({ order: { createdAt: 'DESC' } });
    return all.filter((p) => this._helper.isWithinWindow(p));
  }

  async getBySlug(slug: string): Promise<Promotion | null> {
    return this.repository.findOne({ where: { slug } });
  }

  // ── Checkout ────────────────────────────────────────────────────────────────

  /** Validate a promo code against a subtotal (and optional customer limits). */
  async validateCode(dto: ValidatePromotionDto): Promise<ValidatePromotionResult> {
    const code = dto.code.trim().toUpperCase();
    const promotion = await this.repository.findOne({ where: { code } });
    if (!promotion) return { valid: false, reason: 'Invalid promo code', discountAmount: 0 };

    if (!this._helper.isWithinWindow(promotion)) {
      return { valid: false, reason: 'This promotion is not currently available', discountAmount: 0 };
    }
    if (dto.subtotal < (promotion.minOrderAmount ?? 0)) {
      return {
        valid: false,
        reason: `Spend at least ${promotion.minOrderAmount} to use this code`,
        discountAmount: 0,
      };
    }
    if (promotion.usageLimit != null && promotion.usageCount >= promotion.usageLimit) {
      return { valid: false, reason: 'This promotion has reached its limit', discountAmount: 0 };
    }
    if (dto.customerId && promotion.perCustomerLimit != null) {
      const used = await this.redemptions.count({
        where: { promotionId: promotion.id, customerId: dto.customerId },
      });
      if (used >= promotion.perCustomerLimit) {
        return { valid: false, reason: 'You have already used this promotion', discountAmount: 0 };
      }
    }

    const discountAmount = this._helper.calcDiscount(promotion, dto.subtotal);
    if (discountAmount <= 0) {
      return { valid: false, reason: 'This code does not apply to your order', discountAmount: 0 };
    }
    return { valid: true, discountAmount, promotion };
  }

  /**
   * Record a redemption and bump the global counter. Call after an order that
   * used a promotion is created. Never throws — a failed record must not block
   * the order.
   */
  async redeem(input: {
    promotionId: string;
    customerId?: string | null;
    orderId?: string | null;
    code?: string | null;
    discountAmount: number;
  }): Promise<void> {
    try {
      await this.redemptions.save(
        this.redemptions.create({
          promotionId: input.promotionId,
          customerId: input.customerId ?? null,
          orderId: input.orderId ?? null,
          code: input.code ?? null,
          discountAmount: input.discountAmount,
        }),
      );
      await this.repository.increment({ id: input.promotionId }, 'usageCount', 1);
    } catch {
      /* best-effort: don't fail the order over a redemption-log write */
    }
  }
}
