import { httpClient } from "@/lib/httpClient";
import type {
  CreateTransactionInput,
  Paginated,
  Transaction,
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
        },
      })
      .then((r) => r.data);
  },

  create(body: CreateTransactionInput) {
    return httpClient.post<Transaction>("/transactions", body, { auth: true }).then((r) => r.data);
  },
};
