"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Ban,
  ChevronRight,
  Eye,
  Loader2,
  ReceiptText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatDateTime } from "@/lib/datetime";

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
  // Cancel-with-reason dialog: which order, the typed reason, and a validation flag.
  const [cancelFor, setCancelFor] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState(false);
  // Read-only "view details" dialog.
  const [detailFor, setDetailFor] = useState<Order | null>(null);
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
  // Open the cancel dialog (a reason is required before the order is cancelled).
  const openCancel = (order: Order) => {
    setCancelFor(order);
    setCancelReason("");
    setCancelError(false);
  };

  const confirmCancel = async () => {
    const order = cancelFor;
    const reason = cancelReason.trim();
    if (!order) return;
    if (!reason) {
      setCancelError(true);
      return;
    }
    setBusyId(order.id);
    try {
      await orderService.update(order.id, { status: "cancelled", cancellationReason: reason });
      toast("Order cancelled", { tone: "success" });
      setCancelFor(null);
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Cancel failed", { tone: "error" });
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
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="View order details"
                            onClick={() => setDetailFor(order)}
                          >
                            <Eye className="size-4" />
                          </Button>
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
                              size="sm"
                              aria-label="Cancel order"
                              disabled={busyId === order.id}
                              onClick={() => openCancel(order)}
                            >
                              <X className="size-4" />
                              Cancel
                            </Button>
                          )}
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

      <Dialog open={!!cancelFor} onOpenChange={(open) => !open && setCancelFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel order {cancelFor?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason for cancellation</Label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError(false);
              }}
              rows={3}
              autoFocus
              placeholder="e.g. Customer changed their mind, item unavailable…"
              aria-invalid={cancelError}
              className="flex w-full rounded-xl border border-input bg-white px-3.5 py-2 text-sm text-ink shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20"
            />
            {cancelError && (
              <p className="text-xs text-destructive">A reason is required to cancel this order.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelFor(null)} disabled={!!busyId}>
              Keep order
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmCancel()}
              disabled={busyId === cancelFor?.id}
            >
              {busyId === cancelFor?.id && <Loader2 className="size-4 animate-spin" />}
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailFor} onOpenChange={(open) => !open && setDetailFor(null)}>
        <DialogContent className="max-w-lg">
          {detailFor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  Order {detailFor.orderNumber}
                  <StatusPill tone={ORDER_STATUS_META[detailFor.status].tone}>
                    {ORDER_STATUS_META[detailFor.status].label}
                  </StatusPill>
                  <StatusPill
                    tone={detailFor.paymentStatus === "paid" ? "green" : "amber"}
                    dot={false}
                  >
                    {detailFor.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </StatusPill>
                </DialogTitle>
              </DialogHeader>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                {detailFor.status === "cancelled" && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                    <Ban className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Cancelled</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {detailFor.cancellationReason || "No reason provided."}
                      </p>
                    </div>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Detail label="Type" value={ORDER_TYPE_META[detailFor.orderType].label} />
                  <Detail
                    label={detailFor.table ? "Table" : "Customer"}
                    value={detailFor.table?.name ?? detailFor.customerName ?? "—"}
                  />
                  {detailFor.customerPhone && (
                    <Detail label="Phone" value={detailFor.customerPhone} />
                  )}
                  {detailFor.paymentMethod && (
                    <Detail label="Payment" value={detailFor.paymentMethod} />
                  )}
                  <Detail label="Placed" value={formatDateTime(detailFor.createdAt)} />
                  {detailFor.branch?.name && (
                    <Detail label="Branch" value={detailFor.branch.name} />
                  )}
                </dl>

                <div className="rounded-xl border border-border">
                  <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Items
                  </p>
                  <ul className="divide-y divide-border">
                    {detailFor.items.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-ink">
                          <span className="text-muted-foreground">{it.quantity}×</span> {it.name}
                        </span>
                        <span className="shrink-0 font-medium text-ink">
                          {formatMoney(it.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <dl className="space-y-1 border-t border-border px-3 py-2 text-sm">
                    <Row label="Subtotal" value={formatMoney(detailFor.subtotal)} />
                    {detailFor.tax > 0 && <Row label="Tax" value={formatMoney(detailFor.tax)} />}
                    {detailFor.discount > 0 && (
                      <Row label="Discount" value={`−${formatMoney(detailFor.discount)}`} />
                    )}
                    <div className="flex justify-between pt-1 text-base font-semibold text-ink">
                      <span>Total</span>
                      <span>{formatMoney(detailFor.total)}</span>
                    </div>
                  </dl>
                </div>

                {detailFor.notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Note
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink">{detailFor.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailFor(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
