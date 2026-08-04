import { httpClient } from "@/lib/httpClient";
import { TABLE_ENDPOINTS } from "@/features/table/constants/table.constants";
import type {
  CreateTableInput,
  DiningTable,
  ListTablesParams,
  Paginated,
  UpdateTableInput,
} from "@/features/table/types/table.types";

export const tableService = {
  list(params?: ListTablesParams) {
    return httpClient
      .get<Paginated<DiningTable>>(TABLE_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          branchId: params?.branchId,
          isActive: params?.isActive,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateTableInput) {
    return httpClient
      .post<DiningTable>(TABLE_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateTableInput) {
    return httpClient
      .put<DiningTable>(TABLE_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(TABLE_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
