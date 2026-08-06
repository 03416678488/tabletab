import { httpClient } from "@/lib/httpClient";
import { ORDER_ENDPOINTS } from "@/features/order/constants/order.constants";
import type {
  CreateOrderInput,
  ListOrdersParams,
  Order,
  Paginated,
  TableStat,
  UpdateOrderInput,
} from "@/features/order/types/order.types";

export const orderService = {
  list(params?: ListOrdersParams) {
    return httpClient
      .get<Paginated<Order>>(ORDER_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          orderType: params?.orderType,
          status: params?.status,
          paymentStatus: params?.paymentStatus,
          tableId: params?.tableId,
          branchId: params?.branchId,
        },
      })
      .then((res) => res.data);
  },

  tableStats() {
    return httpClient
      .get<TableStat[]>(ORDER_ENDPOINTS.tableStats, { auth: true })
      .then((res) => res.data);
  },

  board() {
    return httpClient
      .get<Order[]>(ORDER_ENDPOINTS.board, { auth: true })
      .then((res) => res.data);
  },

  /** The active/open order for a table, or null. */
  byTable(tableId: string) {
    return httpClient
      .get<Order | null>(`/orders/by-table/${tableId}`, { auth: true })
      .then((res) => res.data);
  },

  create(body: CreateOrderInput) {
    return httpClient
      .post<Order>(ORDER_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateOrderInput) {
    return httpClient
      .put<Order>(ORDER_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(ORDER_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
