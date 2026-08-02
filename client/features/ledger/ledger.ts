import { httpClient } from "@/lib/httpClient";

export interface LedgerCategory {
  id: number;
  name: string;
  isActive: boolean;
}

export interface LedgerRecord {
  id: string;
  amount: number;
  categoryId: number | null;
  category?: { id: number; name: string } | null;
  paymentType: string | null;
  referenceNumber: string | null;
  date: string | null;
  note: string | null;
  createdAt: string;
  incomeFor?: string | null;
  expenseFor?: string | null;
}

/** Config that specializes the generic ledger UI for Income vs Expense. */
export interface LedgerConfig {
  kind: "income" | "expense";
  title: string; // "Income" | "Expense"
  base: string; // "/incomes" | "/expenses"
  forField: "incomeFor" | "expenseFor";
  forLabel: string; // "Income For" | "Expense For"
  dateLabel: string; // "Income Date" | "Expense Date"
}

export const PAYMENT_TYPES = ["Cash", "Card", "Bank Transfer", "Cheque", "Other"];

export const INCOME_CONFIG: LedgerConfig = {
  kind: "income",
  title: "Income",
  base: "/incomes",
  forField: "incomeFor",
  forLabel: "Income For",
  dateLabel: "Income Date",
};

export const EXPENSE_CONFIG: LedgerConfig = {
  kind: "expense",
  title: "Expense",
  base: "/expenses",
  forField: "expenseFor",
  forLabel: "Expense For",
  dateLabel: "Expense Date",
};

export function ledgerService(base: string) {
  return {
    list: () => httpClient.get<LedgerRecord[]>(base, { auth: true }).then((r) => r.data),
    create: (body: Record<string, unknown>) =>
      httpClient.post<LedgerRecord>(base, body, { auth: true }).then((r) => r.data),
    update: (id: string, body: Record<string, unknown>) =>
      httpClient.put<LedgerRecord>(`${base}/${id}`, body, { auth: true }).then((r) => r.data),
    remove: (id: string) =>
      httpClient.delete<{ message: string }>(`${base}/${id}`, { auth: true }).then((r) => r.data),

    categories: () =>
      httpClient.get<LedgerCategory[]>(`${base}/categories`, { auth: true }).then((r) => r.data),
    createCategory: (body: { name: string; isActive?: boolean }) =>
      httpClient.post<LedgerCategory>(`${base}/categories`, body, { auth: true }).then((r) => r.data),
    updateCategory: (id: number, body: Partial<{ name: string; isActive: boolean }>) =>
      httpClient.put<LedgerCategory>(`${base}/categories/${id}`, body, { auth: true }).then((r) => r.data),
    removeCategory: (id: number) =>
      httpClient
        .delete<{ message: string }>(`${base}/categories/${id}`, { auth: true })
        .then((r) => r.data),
  };
}
