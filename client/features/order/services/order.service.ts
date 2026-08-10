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

  tableStats(branchId?: string) {
    return httpClient
      .get<TableStat[]>(ORDER_ENDPOINTS.tableStats, { auth: true, params: { branchId } })
      .then((res) => res.data);
  },

  board(branchId?: string) {
    return httpClient
      .get<Order[]>(ORDER_ENDPOINTS.board, { auth: true, params: { branchId } })
      .then((res) => res.data);
  },

  /** All running orders in a branch (POS "load open order" picker). */
  active(branchId?: string) {
    return httpClient
      .get<Order[]>("/orders/active", { auth: true, params: { branchId } })
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

  /** Close a table's session — settle every active order on it and free it.
   *  `markPaid` true (default) settles as paid; false records a walkout/comp. */
  closeTable(tableId: string, markPaid = true) {
    return httpClient
      .post<{ closed: number; total: number }>(
        `/orders/table/${tableId}/close`,
        { markPaid },
        { auth: true },
      )
      .then((res) => res.data);
  },
};
