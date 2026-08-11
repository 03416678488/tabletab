import { httpClient } from "@/lib/httpClient";
import type {
  AdjustStockInput,
  CreateStockItemInput,
  CreateStockTakeInput,
  InventoryReport,
  ItemRecipe,
  ListStockItemsParams,
  ListStockTakesParams,
  Paginated,
  SetRecipeInput,
  StockItem,
  StockMovement,
  StockTake,
  UpdateStockItemInput,
  UpdateStockTakeInput,
} from "@/features/inventory/types/inventory.types";

export const inventoryService = {
  listStockItems(params?: ListStockItemsParams) {
    return httpClient
      .get<Paginated<StockItem>>("/inventory/stock-items", {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          isActive: params?.isActive,
          branchId: params?.branchId,
          lowStock: params?.lowStock,
        },
      })
      .then((r) => r.data);
  },

  createStockItem(body: CreateStockItemInput) {
    return httpClient
      .post<StockItem>("/inventory/stock-items", body, { auth: true })
      .then((r) => r.data);
  },

  updateStockItem(id: string, body: UpdateStockItemInput) {
    return httpClient
      .put<StockItem>(`/inventory/stock-items/${id}`, body, { auth: true })
      .then((r) => r.data);
  },

  deleteStockItem(id: string) {
    return httpClient
      .delete<{ message: string }>(`/inventory/stock-items/${id}`, { auth: true })
      .then((r) => r.data);
  },

  adjust(body: AdjustStockInput) {
    return httpClient.post<unknown>("/inventory/adjust", body, { auth: true }).then((r) => r.data);
  },

  movements(params: { stockItemId?: string; branchId?: string; page?: number; perPage?: number }) {
    return httpClient
      .get<Paginated<StockMovement>>("/inventory/movements", {
        auth: true,
        params,
      })
      .then((r) => r.data);
  },

  getRecipe(menuItemId: string) {
    return httpClient
      .get<ItemRecipe>(`/inventory/recipe/${menuItemId}`, { auth: true })
      .then((r) => r.data);
  },

  setRecipe(menuItemId: string, body: SetRecipeInput) {
    return httpClient
      .put<ItemRecipe>(`/inventory/recipe/${menuItemId}`, body, { auth: true })
      .then((r) => r.data);
  },

  // ---- Stock takes ----
  listStockTakes(params?: ListStockTakesParams) {
    return httpClient
      .get<Paginated<StockTake>>("/inventory/stock-takes", {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          branchId: params?.branchId,
          status: params?.status,
        },
      })
      .then((r) => r.data);
  },
  getStockTake(id: string) {
    return httpClient
      .get<StockTake>(`/inventory/stock-takes/${id}`, { auth: true })
      .then((r) => r.data);
  },
  createStockTake(body: CreateStockTakeInput) {
    return httpClient
      .post<StockTake>("/inventory/stock-takes", body, { auth: true })
      .then((r) => r.data);
  },
  updateStockTake(id: string, body: UpdateStockTakeInput) {
    return httpClient
      .put<StockTake>(`/inventory/stock-takes/${id}`, body, { auth: true })
      .then((r) => r.data);
  },
  completeStockTake(id: string) {
    return httpClient
      .post<StockTake>(`/inventory/stock-takes/${id}/complete`, undefined, { auth: true })
      .then((r) => r.data);
  },
  cancelStockTake(id: string) {
    return httpClient
      .post<StockTake>(`/inventory/stock-takes/${id}/cancel`, undefined, { auth: true })
      .then((r) => r.data);
  },
  deleteStockTake(id: string) {
    return httpClient
      .delete<{ message: string }>(`/inventory/stock-takes/${id}`, { auth: true })
      .then((r) => r.data);
  },

  // ---- Reports ----
  report(params: { branchId?: string; from?: string; to?: string }) {
    return httpClient
      .get<InventoryReport>("/inventory/reports", { auth: true, params })
      .then((r) => r.data);
  },
};
