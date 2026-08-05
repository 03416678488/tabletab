import { Injectable } from '@nestjs/common';

import { Promotion } from '../entities/promotion.entity';
import { CreatePromotionDto, UpdatePromotionDto } from '../dto';

/** Pure helpers: slugging, payload normalisation, and discount maths. */
@Injectable()
export class PromotionHelperService {
  slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  resolveCreatePayload(dto: CreatePromotionDto): Partial<Promotion> {
    return {
      title: dto.title,
      slug: dto.slug?.trim() || this.slugify(dto.title),
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      code: dto.code?.trim() ? dto.code.trim().toUpperCase() : null,
      minOrderAmount: dto.minOrderAmount ?? 0,
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      active: dto.active ?? true,
      usageLimit: dto.usageLimit ?? null,
      perCustomerLimit: dto.perCustomerLimit ?? null,
      ctaHref: dto.ctaHref?.trim() || null,
    };
  }

  resolveUpdatePayload(dto: UpdatePromotionDto): Partial<Promotion> {
    const out: Partial<Promotion> = {};
    if (dto.title !== undefined) out.title = dto.title;
    if (dto.slug !== undefined) out.slug = dto.slug.trim();
    if (dto.description !== undefined) out.description = dto.description || null;
    if (dto.imageUrl !== undefined) out.imageUrl = dto.imageUrl || null;
    if (dto.discountType !== undefined) out.discountType = dto.discountType;
    if (dto.discountValue !== undefined) out.discountValue = dto.discountValue;
    if (dto.code !== undefined) out.code = dto.code.trim() ? dto.code.trim().toUpperCase() : null;
    if (dto.minOrderAmount !== undefined) out.minOrderAmount = dto.minOrderAmount;
    if (dto.maxDiscountAmount !== undefined) out.maxDiscountAmount = dto.maxDiscountAmount ?? null;
    if (dto.startsAt !== undefined) out.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) out.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.active !== undefined) out.active = dto.active;
    if (dto.usageLimit !== undefined) out.usageLimit = dto.usageLimit ?? null;
    if (dto.perCustomerLimit !== undefined) out.perCustomerLimit = dto.perCustomerLimit ?? null;
    if (dto.ctaHref !== undefined) out.ctaHref = dto.ctaHref?.trim() || null;
    return out;
  }

  /** Is the promotion live right now (active flag + within its date window)? */
  isWithinWindow(promotion: Promotion, at: Date = new Date()): boolean {
    if (!promotion.active) return false;
    if (promotion.startsAt && at < new Date(promotion.startsAt)) return false;
    if (promotion.endsAt && at > new Date(promotion.endsAt)) return false;
    return true;
  }

  /**
   * Discount amount for a given subtotal, rounded to cents. Returns 0 when the
   * subtotal is below the promo's minimum. Percentage discounts respect the cap.
   */
  calcDiscount(promotion: Promotion, subtotal: number): number {
    if (subtotal < (promotion.minOrderAmount ?? 0)) return 0;
    let discount =
      promotion.discountType === 'percentage'
        ? (subtotal * promotion.discountValue) / 100
        : promotion.discountValue;
    if (promotion.maxDiscountAmount != null) {
      discount = Math.min(discount, promotion.maxDiscountAmount);
    }
    discount = Math.min(discount, subtotal); // never exceed the cart
    return Math.round(discount * 100) / 100;
  }
}
