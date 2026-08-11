import { httpClient } from "@/lib/httpClient";
import type {
  CreatePurchaseOrderInput,
  CreateSupplierInput,
  ListPurchaseOrdersParams,
  ListSuppliersParams,
  Paginated,
  PurchaseOrder,
  Supplier,
  UpdatePurchaseOrderInput,
  UpdateSupplierInput,
} from "@/features/purchasing/types/purchasing.types";

export const purchasingService = {
  // ---- Suppliers ----
  listSuppliers(params?: ListSuppliersParams) {
    return httpClient
      .get<Paginated<Supplier>>("/suppliers", {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          isActive: params?.isActive,
        },
      })
      .then((r) => r.data);
  },
  createSupplier(body: CreateSupplierInput) {
    return httpClient.post<Supplier>("/suppliers", body, { auth: true }).then((r) => r.data);
  },
  updateSupplier(id: string, body: UpdateSupplierInput) {
    return httpClient.put<Supplier>(`/suppliers/${id}`, body, { auth: true }).then((r) => r.data);
  },
  deleteSupplier(id: string) {
    return httpClient
      .delete<{ message: string }>(`/suppliers/${id}`, { auth: true })
      .then((r) => r.data);
  },

  // ---- Purchase orders ----
  listPurchaseOrders(params?: ListPurchaseOrdersParams) {
    return httpClient
      .get<Paginated<PurchaseOrder>>("/purchase-orders", {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          branchId: params?.branchId,
          supplierId: params?.supplierId,
          status: params?.status,
        },
      })
      .then((r) => r.data);
  },
  getPurchaseOrder(id: string) {
    return httpClient
      .get<PurchaseOrder>(`/purchase-orders/${id}`, { auth: true })
      .then((r) => r.data);
  },
  createPurchaseOrder(body: CreatePurchaseOrderInput) {
    return httpClient
      .post<PurchaseOrder>("/purchase-orders", body, { auth: true })
      .then((r) => r.data);
  },
  updatePurchaseOrder(id: string, body: UpdatePurchaseOrderInput) {
    return httpClient
      .put<PurchaseOrder>(`/purchase-orders/${id}`, body, { auth: true })
      .then((r) => r.data);
  },
  receivePurchaseOrder(id: string) {
    return httpClient
      .post<PurchaseOrder>(`/purchase-orders/${id}/receive`, undefined, { auth: true })
      .then((r) => r.data);
  },
  cancelPurchaseOrder(id: string) {
    return httpClient
      .post<PurchaseOrder>(`/purchase-orders/${id}/cancel`, undefined, { auth: true })
      .then((r) => r.data);
  },
  deletePurchaseOrder(id: string) {
    return httpClient
      .delete<{ message: string }>(`/purchase-orders/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
