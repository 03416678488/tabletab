import { httpClient } from "@/lib/httpClient";
import { PROMOTION_ENDPOINTS } from "@/features/promotion/constants/promotion.constants";
import type {
  CreatePromotionInput,
  ListPromotionsParams,
  Paginated,
  Promotion,
  UpdatePromotionInput,
} from "@/features/promotion/types/promotion.types";

export const promotionService = {
  list(params?: ListPromotionsParams) {
    return httpClient
      .get<Paginated<Promotion>>(PROMOTION_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          active: params?.active,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreatePromotionInput) {
    return httpClient
      .post<Promotion>(PROMOTION_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdatePromotionInput) {
    return httpClient
      .put<Promotion>(PROMOTION_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(PROMOTION_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
