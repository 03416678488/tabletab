import { httpClient } from "@/lib/httpClient";
import { MENUS_ENDPOINTS } from "@/features/menu-list/constants/menu.constants";
import type {
  CreateMenuInput,
  ListMenusParams,
  Menu,
  Paginated,
  UpdateMenuInput,
} from "@/features/menu-list/types/menu.types";

export const menusService = {
  list(params?: ListMenusParams) {
    return httpClient
      .get<Paginated<Menu>>(MENUS_ENDPOINTS.base, {
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

  create(body: CreateMenuInput) {
    return httpClient
      .post<Menu>(MENUS_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateMenuInput) {
    return httpClient
      .put<Menu>(MENUS_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(MENUS_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
