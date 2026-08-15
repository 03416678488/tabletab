import { httpClient } from "@/lib/httpClient";
import type {
  CreateTransactionInput,
  Paginated,
  Transaction,
  TransactionDetail,
  TransactionSummary,
  ListTransactionsParams,
} from "@/features/transaction/types/transaction.types";

export const transactionService = {
  list(params?: ListTransactionsParams) {
    return httpClient
      .get<Paginated<Transaction>>("/transactions", {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          type: params?.type,
          method: params?.method,
          registerSessionId: params?.registerSessionId,
          branchId: params?.branchId,
          from: params?.from,
          to: params?.to,
          minAmount: params?.minAmount,
          maxAmount: params?.maxAmount,
        },
      })
      .then((r) => r.data);
  },

  /** Aggregated totals for the same filter as `list` — powers the summary bar. */
  summary(params?: Omit<ListTransactionsParams, "page" | "perPage">) {
    return httpClient
      .get<TransactionSummary>("/transactions/summary", {
        auth: true,
        params: {
          type: params?.type,
          method: params?.method,
          registerSessionId: params?.registerSessionId,
          branchId: params?.branchId,
          from: params?.from,
          to: params?.to,
          minAmount: params?.minAmount,
          maxAmount: params?.maxAmount,
        },
      })
      .then((r) => r.data);
  },

  getById(id: string) {
    return httpClient
      .get<TransactionDetail>(`/transactions/${id}`, { auth: true })
      .then((r) => r.data);
  },

  create(body: CreateTransactionInput) {
    return httpClient.post<Transaction>("/transactions", body, { auth: true }).then((r) => r.data);
  },
};
