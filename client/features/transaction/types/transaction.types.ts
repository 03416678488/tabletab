export type TransactionType =
  "sale" | "refund" | "cash_in" | "cash_out" | "reservation_deposit" | "event_payment";
export type PaymentMethod = "cash" | "card" | "mfs" | "other";

export interface Transaction {
  id: string;
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  orderId: string | null;
  registerSessionId: string | null;
  note: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    /** The waiter who served the order, when one was assigned. */
    assignedWaiter?: { firstName: string | null; lastName: string | null } | null;
  } | null;
}

/** Waiter shape as loaded on the order relation. */
interface WaiterRef {
  firstName: string | null;
  lastName: string | null;
}

/** Full transaction detail loaded for the drawer (order lines, customer, register). */
export interface TransactionDetail extends Transaction {
  order?: {
    id: string;
    orderNumber: string;
    orderType?: string;
    status?: string;
    subtotal?: number;
    discount?: number;
    tax?: number;
    total?: number;
    branchId?: string | null;
    assignedWaiter?: WaiterRef | null;
    customer?: { firstName: string | null; lastName: string | null; phone?: string | null } | null;
    items?: { id: string; name: string; quantity: number; lineTotal: number }[];
  } | null;
  registerSession?: {
    id: string;
    status: string;
    openedAt: string;
    closedAt: string | null;
  } | null;
}

/** Aggregated totals for the current filter (drives the summary bar). */
export interface TransactionSummary {
  count: number;
  totalIn: number;
  totalOut: number;
  net: number;
  byType: { type: string; count: number; sum: number }[];
}

export interface CreateTransactionInput {
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  orderId?: string;
  note?: string;
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

export interface ListTransactionsParams {
  page?: number;
  perPage?: number;
  type?: TransactionType;
  method?: PaymentMethod;
  registerSessionId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
}
