import { httpClient } from "@/lib/httpClient";
import { FOOD_TYPE_ENDPOINTS } from "@/features/food-type/constants/food-type.constants";
import type {
  CreateFoodTypeInput,
  FoodType,
  ListFoodTypesParams,
  Paginated,
  UpdateFoodTypeInput,
} from "@/features/food-type/types/food-type.types";

export const foodTypeService = {
  list(params?: ListFoodTypesParams) {
    return httpClient
      .get<Paginated<FoodType>>(FOOD_TYPE_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          isActive: params?.isActive,
          branchId: params?.branchId,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateFoodTypeInput) {
    return httpClient
      .post<FoodType>(FOOD_TYPE_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateFoodTypeInput) {
    return httpClient
      .put<FoodType>(FOOD_TYPE_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(FOOD_TYPE_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
