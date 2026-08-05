import { httpClient } from "@/lib/httpClient";
import { PROMOTION_ENDPOINTS } from "@/features/promotion/constants/promotion.constants";
import type { Promotion } from "@/features/promotion/types/promotion.types";

/** Public: a single promotion for its storefront landing page. */
export async function fetchPromotionBySlug(slug: string): Promise<Promotion | null> {
  const res = await httpClient.get<Promotion | null>(PROMOTION_ENDPOINTS.bySlug(slug));
  return res.data ?? null;
}

/** Public: live promotions (active + within their window) for sliders / pickers. */
export async function fetchActivePromotions(): Promise<Promotion[]> {
  const res = await httpClient.get<Promotion[]>(PROMOTION_ENDPOINTS.active);
  return res.data ?? [];
}

export interface PromoValidation {
  valid: boolean;
  reason?: string;
  discountAmount: number;
  promotion?: Promotion;
}

/** Public: check a promo code against the cart subtotal (preview the discount). */
export async function validatePromotionCode(input: {
  code: string;
  subtotal: number;
  customerId?: string;
}): Promise<PromoValidation> {
  const res = await httpClient.post<PromoValidation>(PROMOTION_ENDPOINTS.validate, input);
  return res.data;
}

/** True when the promotion is active and within its start/end window. */
export function isPromotionLive(p: Promotion, at: number = Date.now()): boolean {
  if (!p.active) return false;
  if (p.startsAt && new Date(p.startsAt).getTime() > at) return false;
  if (p.endsAt && new Date(p.endsAt).getTime() < at) return false;
  return true;
}

/** "30% off" / "$5.00 off" — formatted with the storefront currency helper. */
export function promotionDiscountLabel(
  p: Promotion,
  formatCurrency: (n: number) => string,
): string {
  return p.discountType === "percentage"
    ? `${p.discountValue}% OFF`
    : `${formatCurrency(p.discountValue)} OFF`;
}
