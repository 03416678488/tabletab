export type DiscountType = "percentage" | "fixed";

export interface Promotion {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  discountType: DiscountType;
  discountValue: number;
  code: string | null;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  /** Products this promotion discounts. Empty = cart-wide. */
  products?: { id: string; name: string }[];
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface CreatePromotionInput {
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  discountType: DiscountType;
  discountValue: number;
  code?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
  usageLimit?: number;
  perCustomerLimit?: number;
  /** Menu item ids this promotion discounts. Empty/omitted = cart-wide. */
  productIds?: string[];
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>;

export interface ListPromotionsParams {
  page?: number;
  perPage?: number;
  search?: string;
  active?: boolean;
}
