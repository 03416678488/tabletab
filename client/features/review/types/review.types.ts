export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewSource = "online" | "staff";

export interface Review {
  id: string;
  menuItemId: string;
  branchId: string | null;
  rating: number;
  comment: string | null;
  guestName: string;
  guestEmail: string | null;
  status: ReviewStatus;
  source: ReviewSource;
  moderatedAt: string | null;
  moderatedBy: string | null;
  createdAt: string;
  menuItem?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
}

export interface ReviewSummary {
  menuItemId: string;
  average: number;
  count: number;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
  links: Record<string, string>;
}

export interface ListReviewsParams {
  page?: number;
  perPage?: number;
  search?: string;
  menuItemId?: string;
  branchId?: string;
  status?: ReviewStatus;
}

export interface CreateReviewInput {
  menuItemId: string;
  branchId?: string;
  rating: number;
  comment?: string;
  guestName: string;
  guestEmail?: string;
}
