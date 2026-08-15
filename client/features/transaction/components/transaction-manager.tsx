"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Download, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  DateRangeFilter,
  defaultDateRange,
  type DateRange,
} from "@/components/ui/date-range-filter";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { toast } from "@/components/ui/toast";

import { usePaginatedTransactions } from "@/features/transaction/hooks/use-paginated-transactions";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { transactionService } from "@/features/transaction/services/transaction.service";
import { exportTransactionsCsv } from "@/features/transaction/lib/export-transactions-csv";
import type {
  PaymentMethod,
  TransactionDetail,
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

/** Parse a text field to a non-negative number, or undefined when blank/invalid. */
function toAmount(v: string): number | undefined {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function TransactionManager() {
  const [type, setType] = useState("");
  const [method, setMethod] = useState("");
  const [minRaw, setMinRaw] = useState("");
  const [maxRaw, setMaxRaw] = useState("");
  const [range, setRange] = useState<DateRange>(defaultDateRange);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Debounce the amount inputs so each keystroke doesn't refetch.
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  useEffect(() => {
    const t = setTimeout(() => {
      setMinAmount(toAmount(minRaw));
      setMaxAmount(toAmount(maxRaw));
    }, 350);
    return () => clearTimeout(t);
  }, [minRaw, maxRaw]);

  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();

  const filters = {
    ...(type ? { type: type as TransactionType } : {}),
    ...(method ? { method: method as PaymentMethod } : {}),
    ...(branchId ? { branchId } : {}),
    ...(minAmount != null ? { minAmount } : {}),
    ...(maxAmount != null ? { maxAmount } : {}),
    from: `${range.from}T00:00:00`,
    to: `${range.to}T23:59:59`,
  };

  const {
    transactions,
    summary,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedTransactions(filters);

  async function handleExport() {
    setExporting(true);
    try {
      await exportTransactionsCsv(filters);
    } catch {
      toast("Couldn't export transactions", { tone: "error" });
    } finally {
      setExporting(false);
    }
  }

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
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={range} onChange={setRange} />
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
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            className="w-24"
            placeholder="Min"
            value={minRaw}
            onChange={(e) => setMinRaw(e.target.value)}
            aria-label="Minimum amount"
          />
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            className="w-24"
            placeholder="Max"
            value={maxRaw}
            onChange={(e) => setMaxRaw(e.target.value)}
            aria-label="Maximum amount"
          />
          <Button variant="outline" onClick={handleExport} disabled={exporting || totalItems === 0}>
            <Download className="size-4" /> {exporting ? "Exporting…" : "Export"}
          </Button>
        </div>
      </div>

      {/* Live summary of the current filter. */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={<TrendingUp className="size-4 text-emerald-600" />}
          label="Money in"
          value={formatMoney(summary?.totalIn ?? 0)}
          loading={loading && !summary}
        />
        <SummaryCard
          icon={<TrendingDown className="size-4 text-rose-600" />}
          label="Money out"
          value={formatMoney(summary?.totalOut ?? 0)}
          loading={loading && !summary}
        />
        <SummaryCard
          icon={<Wallet className="size-4 text-brand" />}
          label="Net"
          value={formatMoney(summary?.net ?? 0)}
          loading={loading && !summary}
        />
        <SummaryCard
          icon={<ArrowLeftRight className="size-4 text-muted-foreground" />}
          label="Count"
          value={String(summary?.count ?? totalItems)}
          loading={loading && !summary}
        />
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
                    <TableRow
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(t.id)}
                    >
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

      <TransactionDetailSheet id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-6 w-20" />
      ) : (
        <div className="mt-1 font-display text-lg font-semibold text-ink">{value}</div>
      )}
    </Card>
  );
}

function TransactionDetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setDetail(null);
    transactionService
      .getById(id)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch(() => {
        if (active) toast("Couldn't load transaction", { tone: "error" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const meta = detail ? TYPE_META[detail.type] : null;
  const order = detail?.order;
  const customer = order?.customer;
  const customerName =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim() || null;
  const waiter = order?.assignedWaiter;
  const waiterName = [waiter?.firstName, waiter?.lastName].filter(Boolean).join(" ").trim() || null;

  return (
    <Sheet open={id != null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Transaction detail</SheetTitle>
          <SheetDescription>{detail ? formatDateTime(detail.createdAt) : "—"}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading || !detail ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-5 text-sm">
              <div className="flex items-center justify-between">
                {meta && <StatusPill tone={meta.tone}>{meta.label}</StatusPill>}
                <span className="font-display text-xl font-semibold text-ink">
                  {meta?.sign}
                  {formatMoney(detail.amount)}
                </span>
              </div>

              <dl className="space-y-2">
                <Row label="Method" value={METHOD_LABEL[detail.method]} />
                {detail.note && <Row label="Note" value={detail.note} />}
                {order?.orderNumber && <Row label="Order" value={order.orderNumber} />}
                {order?.orderType && <Row label="Order type" value={order.orderType} />}
                {order?.status && <Row label="Order status" value={order.status} />}
                {waiterName && <Row label="Served by" value={waiterName} />}
                {customerName && <Row label="Customer" value={customerName} />}
                {customer?.phone && <Row label="Phone" value={customer.phone} />}
                {detail.registerSession && (
                  <Row
                    label="Register"
                    value={`${detail.registerSession.status} · opened ${formatDateTime(
                      detail.registerSession.openedAt,
                    )}`}
                  />
                )}
              </dl>

              {order?.items && order.items.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Order items
                  </div>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between px-3 py-2">
                        <span className="text-ink">
                          {it.quantity}× {it.name}
                        </span>
                        <span className="text-muted-foreground">{formatMoney(it.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                  {order.total != null && (
                    <div className="mt-2 flex items-center justify-between px-3 text-sm font-semibold text-ink">
                      <span>Order total</span>
                      <span>{formatMoney(order.total)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
