"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ReceiptText, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { formatMoney } from "@/lib/currency";

import { Pagination } from "@/components/ui/pagination";
import { usePaginatedOrders } from "@/features/order/hooks/use-paginated-orders";
import { orderService } from "@/features/order/services/order.service";
import {
  ORDER_STATUS_META,
  ORDER_TYPE_META,
  nextStatus,
} from "@/features/order/constants/order.constants";
import { PaymentDialog, type PaymentResult } from "@/features/order/components/payment-dialog";
import { paymentMethodLabel } from "@/features/order/lib/payment-label";
import type { Order, OrderStatus, OrderType } from "@/features/order/types/order.types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function itemCount(order: Order): number {
  return order.items.reduce((n, it) => n + it.quantity, 0);
}

interface OrderListViewProps {
  orderType?: OrderType;
  title: string;
  subtitle: string;
}

export function OrderListView({ orderType, title, subtitle }: OrderListViewProps) {
  // A notification deep-link lands here with ?q=<orderNumber> so the list opens
  // pre-searched to that specific order.
  const initialQuery = useSearchParams().get("q") ?? "";
  const [search, setSearch] = useState(initialQuery);
  // While the search still matches the deep-link, ignore the topbar branch
  // filter — the notified order may belong to a different branch than the one
  // currently selected, and clicking the alert must always land on it.
  const isDeepLink = initialQuery !== "" && search === initialQuery;
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const activeFilters = (statusFilter !== "all" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0);

  const {
    orders,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedOrders({
    orderType,
    search,
    status: statusFilter === "all" ? undefined : statusFilter,
    paymentStatus: paymentFilter === "all" ? undefined : paymentFilter,
    crossBranch: isDeepLink,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Order | null>(null);
  // Synchronous guard so a click can't fire again before the refetch lands.
  const inFlight = useRef<Set<string>>(new Set());

  const patch = async (order: Order, body: Parameters<typeof orderService.update>[1]) => {
    if (inFlight.current.has(order.id)) return; // block re-entrant clicks
    inFlight.current.add(order.id);
    setBusyId(order.id);
    try {
      await orderService.update(order.id, body);
      await refetch(); // keep the button disabled until the list reflects the new status
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", { tone: "error" });
    } finally {
      inFlight.current.delete(order.id);
      setBusyId(null);
    }
  };

  const advance = (order: Order) => {
    const next = nextStatus(order.status, order.orderType);
    if (!next) return;
    // Completing an unpaid order collects payment first.
    if (next === "completed" && order.paymentStatus === "unpaid") {
      setPayFor(order);
      return;
    }
    void patch(order, { status: next });
  };

  const settleAndComplete = (order: Order, result: PaymentResult) => {
    setPayFor(null);
    void patch(order, {
      status: "completed",
      paymentStatus: "paid",
      paymentMethod: paymentMethodLabel(result),
    });
  };
  const confirm = useConfirm();

  const cancel = async (order: Order) => {
    const ok = await confirm({
      title: `Cancel order ${order.orderNumber}?`,
      confirmLabel: "Cancel order",
    });
    if (!ok) return;
    void patch(order, { status: "cancelled" });
  };

  const remove = async (order: Order) => {
    if (!(await confirm({ title: `Delete order ${order.orderNumber}?`, confirmLabel: "Delete" })))
      return;
    setBusyId(order.id);
    try {
      await orderService.remove(order.id);
      toast("Order deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} order{totalItems === 1 ? "" : "s"} · {subtitle}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer, phone, table…"
              className="h-9 pl-9"
              aria-label="Search orders"
            />
          </div>
          <Button
            variant={showFilters || activeFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="size-4" /> Filters
            {activeFilters > 0 && (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <Dropdown
              className="w-44"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as OrderStatus | "all")}
              searchable
              aria-label="Filter by status"
              options={[
                { value: "all", label: "All" },
                ...(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((s) => ({
                  value: s,
                  label: ORDER_STATUS_META[s].label,
                })),
              ]}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Payment
            <Dropdown
              className="w-40"
              value={paymentFilter}
              onChange={(v) => setPaymentFilter(v as "all" | "paid" | "unpaid")}
              aria-label="Filter by payment"
              options={[
                { value: "all", label: "All" },
                { value: "paid", label: "Paid" },
                { value: "unpaid", label: "Unpaid" },
              ]}
            />
          </div>
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setPaymentFilter("all");
              }}
            >
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      )}

      <Card className="mt-5 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={ReceiptText}
            title="Couldn't load orders"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : orders.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={ReceiptText}
            title={search.trim() ? "No matches" : "No orders yet"}
            description={
              search.trim()
                ? "Try a different search."
                : "New orders will appear here as they come in."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Order</TableHead>
                  {!orderType && <TableHead>Type</TableHead>}
                  <TableHead>Table / Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const meta = ORDER_STATUS_META[order.status];
                  const next = nextStatus(order.status, order.orderType);
                  const done =
                    order.status === "completed" ||
                    order.status === "delivered" ||
                    order.status === "cancelled";
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      {!orderType && (
                        <TableCell className="text-muted-foreground">
                          {ORDER_TYPE_META[order.orderType].label}
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">
                        {order.table?.name ?? order.customerName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{itemCount(order)}</TableCell>
                      <TableCell className="font-medium">{formatMoney(order.total)}</TableCell>
                      <TableCell>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={order.paymentStatus === "paid" ? "green" : "amber"}
                          dot={false}
                        >
                          {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {relativeTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {next && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === order.id}
                              onClick={() => advance(order)}
                            >
                              {next === "completed" && order.paymentStatus === "unpaid"
                                ? "Collect payment"
                                : ORDER_STATUS_META[next].label}
                              <ChevronRight className="size-3.5" />
                            </Button>
                          )}
                          {!done && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Cancel order"
                              disabled={busyId === order.id}
                              onClick={() => cancel(order)}
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete order"
                            disabled={busyId === order.id}
                            onClick={() => remove(order)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {!loading && !error && orders.length > 0 && (
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

      <PaymentDialog
        open={!!payFor}
        total={payFor?.total ?? 0}
        onOpenChange={(open) => !open && setPayFor(null)}
        onConfirm={(result) => payFor && settleAndComplete(payFor, result)}
      />
    </div>
  );
}
