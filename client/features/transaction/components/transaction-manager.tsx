"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";

import { usePaginatedTransactions } from "@/features/transaction/hooks/use-paginated-transactions";
import type {
  PaymentMethod,
  TransactionType,
} from "@/features/transaction/types/transaction.types";

const TYPE_META: Record<
  TransactionType,
  { label: string; tone: "green" | "red" | "blue" | "amber"; sign: string }
> = {
  sale: { label: "Sale", tone: "green", sign: "+" },
  refund: { label: "Refund", tone: "red", sign: "−" },
  cash_in: { label: "Cash In", tone: "blue", sign: "+" },
  cash_out: { label: "Cash Out", tone: "amber", sign: "−" },
  reservation_deposit: { label: "Reservation Deposit", tone: "green", sign: "+" },
  event_payment: { label: "Event Payment", tone: "green", sign: "+" },
};
const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  mfs: "MFS",
  other: "Other",
};

export function TransactionManager() {
  const [type, setType] = useState("");
  const [method, setMethod] = useState("");
  const {
    transactions,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedTransactions({
    ...(type ? { type: type as TransactionType } : {}),
    ...(method ? { method: method as PaymentMethod } : {}),
  });

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <ArrowLeftRight className="size-5 text-brand" /> Transactions
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} transaction{totalItems === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Dropdown
            className="w-36"
            value={type}
            onChange={setType}
            placeholder="All types"
            options={[
              { value: "", label: "All types" },
              { value: "sale", label: "Sale" },
              { value: "refund", label: "Refund" },
              { value: "cash_in", label: "Cash In" },
              { value: "cash_out", label: "Cash Out" },
              { value: "reservation_deposit", label: "Reservation Deposit" },
              { value: "event_payment", label: "Event Payment" },
            ]}
          />
          <Dropdown
            className="w-36"
            value={method}
            onChange={setMethod}
            placeholder="All methods"
            options={[
              { value: "", label: "All methods" },
              { value: "cash", label: "Cash" },
              { value: "card", label: "Card" },
              { value: "mfs", label: "MFS" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={ArrowLeftRight}
            title="Couldn't load"
            description={error}
            action={<button onClick={refetch}>Retry</button>}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={ArrowLeftRight}
            title="No transactions"
            description="Payments and cash movements appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Waiter</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const meta = TYPE_META[t.type];
                  const w = t.order?.assignedWaiter;
                  const waiterName =
                    [w?.firstName, w?.lastName].filter(Boolean).join(" ").trim() || "—";
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {METHOD_LABEL[t.method]}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.order?.orderNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{waiterName}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {t.note ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(t.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-ink">
                        {meta.sign}
                        {formatMoney(t.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {!loading && !error && transactions.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}
    </div>
  );
}
