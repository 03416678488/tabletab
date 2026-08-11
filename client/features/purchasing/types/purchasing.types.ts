export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus = "draft" | "ordered" | "received" | "cancelled";

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  stockItemId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  stockItem?: { id: string; name: string; unit: string };
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplierId: string | null;
  supplier?: Supplier | null;
  branchId: string;
  status: PurchaseOrderStatus;
  total: number;
  notes: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  createdBy: string | null;
  lines?: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}
export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface PurchaseOrderLineInput {
  stockItemId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  branchId: string;
  supplierId?: string;
  status?: "draft" | "ordered";
  notes?: string;
  lines: PurchaseOrderLineInput[];
}
export type UpdatePurchaseOrderInput = Partial<CreatePurchaseOrderInput>;

export interface ListSuppliersParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: string;
}

export interface ListPurchaseOrdersParams {
  page?: number;
  perPage?: number;
  search?: string;
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}
