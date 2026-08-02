export type TransactionType = "sale" | "refund" | "cash_in" | "cash_out";
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
  order?: { id: string; orderNumber: string } | null;
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
  from?: string;
  to?: string;
}
