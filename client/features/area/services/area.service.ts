import { httpClient } from "@/lib/httpClient";
import { AREA_ENDPOINTS } from "@/features/area/constants/area.constants";
import type {
  Area,
  CreateAreaInput,
  ListAreasParams,
  Paginated,
  UpdateAreaInput,
} from "@/features/area/types/area.types";

export const areaService = {
  list(params?: ListAreasParams) {
    return httpClient
      .get<Paginated<Area>>(AREA_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          branchId: params?.branchId,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateAreaInput) {
    return httpClient.post<Area>(AREA_ENDPOINTS.base, body, { auth: true }).then((res) => res.data);
  },

  update(id: string, body: UpdateAreaInput) {
    return httpClient
      .put<Area>(AREA_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(AREA_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
