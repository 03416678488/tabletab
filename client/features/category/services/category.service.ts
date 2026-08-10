import { httpClient } from "@/lib/httpClient";
import { CATEGORY_ENDPOINTS } from "@/features/category/constants/category.constants";
import type {
  Category,
  CreateCategoryInput,
  ListCategoriesParams,
  Paginated,
  UpdateCategoryInput,
} from "@/features/category/types/category.types";

export const categoryService = {
  list(params?: ListCategoriesParams) {
    return httpClient
      .get<Paginated<Category>>(CATEGORY_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          isActive: params?.isActive,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateCategoryInput) {
    return httpClient
      .post<Category>(CATEGORY_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateCategoryInput) {
    return httpClient
      .put<Category>(CATEGORY_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(CATEGORY_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },

  bulkRemove(ids: string[]) {
    return httpClient
      .post<{ deleted: number }>(`${CATEGORY_ENDPOINTS.base}/bulk-delete`, { ids }, { auth: true })
      .then((res) => res.data);
  },

  bulkSetActive(ids: string[], isActive: boolean) {
    return httpClient
      .post<{ updated: number }>(
        `${CATEGORY_ENDPOINTS.base}/bulk-active`,
        { ids, isActive },
        { auth: true },
      )
      .then((res) => res.data);
  },
};
