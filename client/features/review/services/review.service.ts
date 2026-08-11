import { httpClient } from "@/lib/httpClient";
import type {
  CreateReviewInput,
  ListReviewsParams,
  Paginated,
  Review,
  ReviewStatus,
  ReviewSummary,
} from "@/features/review/types/review.types";

/** Staff — moderation queue + approve/reject/delete. */
export const reviewService = {
  list(params?: ListReviewsParams) {
    return httpClient
      .get<Paginated<Review>>("/reviews", {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          menuItemId: params?.menuItemId,
          branchId: params?.branchId,
          status: params?.status,
        },
      })
      .then((res) => res.data);
  },

  setStatus(id: string, status: ReviewStatus) {
    return httpClient
      .put<Review>(`/reviews/${id}`, { status }, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(`/reviews/${id}`, { auth: true })
      .then((res) => res.data);
  },
};

/** Public — submit a review from the storefront (guest, no account). */
export function submitReview(body: CreateReviewInput): Promise<Review> {
  return httpClient.post<Review>("/reviews", body).then((res) => res.data);
}

/** Public — approved reviews for an item. */
export function fetchPublishedReviews(menuItemId: string): Promise<Review[]> {
  return httpClient
    .get<Review[]>("/reviews/published", { params: { menuItemId } })
    .then((res) => res.data);
}

/** Public — an item's average rating + approved-review count. */
export function fetchReviewSummary(menuItemId: string): Promise<ReviewSummary> {
  return httpClient
    .get<ReviewSummary>("/reviews/summary", { params: { menuItemId } })
    .then((res) => res.data);
}
