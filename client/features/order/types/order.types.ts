export type OrderType = "pos" | "online" | "table";

export type PaymentStatus = "unpaid" | "paid";

export type OrderStatus =
  | "pending_payment"
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out-for-delivery"
  | "served"
  | "delivered"
  | "completed"
  | "cancelled";

export interface OrderTableRef {
  id: string;
  name: string;
  area?: { id: string; name: string } | null;
}

export interface OrderBranchRef {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  notes: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  tableId: string | null;
  table?: OrderTableRef | null;
  branchId: string | null;
  branch?: OrderBranchRef | null;
  customerId: string | null;
  customer?: { id: string; name: string; phone: string | null } | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  paymentMethod?: string | null;
  paymentStatus: PaymentStatus;
  notes: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
  links: Record<string, string>;
}

export interface CreateOrderItemInput {
  menuItemId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  orderType: OrderType;
  tableId?: string;
  branchId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  tax?: number;
  discount?: number;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  tableId?: string;
  discount?: number;
  tax?: number;
  /** When present, replaces the order's line items. */
  items?: CreateOrderItemInput[];
}

export interface ListOrdersParams {
  page?: number;
  perPage?: number;
  search?: string;
  orderType?: OrderType;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  tableId?: string;
  branchId?: string;
}

/** Live per-table aggregation from GET /orders/table-stats. */
export interface TableStat {
  tableId: string;
  status: "kot" | "occupied";
  orderStatus: OrderStatus;
  orderCount: number;
  itemCount: number;
  total: number;
  lastOrderAt: string;
}
