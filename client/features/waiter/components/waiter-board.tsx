"use client";

import { useMemo, useState } from "react";
import { Bell, ConciergeBell, Receipt, RefreshCw, Utensils } from "lucide-react";
import { ElapsedTimer } from "@/features/ops/components/elapsed-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useServiceRequests } from "@/features/service-request/hooks/use-service-requests";
import { useOrderBoard } from "@/features/order/hooks/use-order-board";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { orderService } from "@/features/order/services/order.service";
import { ApiError } from "@/lib/httpClient";
import type { Order } from "@/features/order/types/order.types";
import type { ServiceRequest } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const REQUEST_LABELS: Record<string, string> = {
  waiter: "Call waiter",
  bill: "Ready to pay",
  water: "Water",
  manager: "Manager",
};

const STATUS_LABEL: Record<string, string> = {
  placed: "New",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
};

const tableNameOf = (o: Order) => o.table?.name ?? o.customer?.name ?? o.customerName ?? "Table";

export function WaiterBoard() {
  // Follow the topbar branch switcher — "All branches" shows every branch.
  const branchId = useScopedBranchId();
  // Live service-request queue (call waiter / ready to pay from QR scans).
  const { requests, resolve: resolveRequest } = useServiceRequests(branchId);
  // Real, live table orders from the order board (SSE + poll; already scoped).
  const { orders, loading, error, refetch, connected } = useOrderBoard();
  const [busyId, setBusyId] = useState<string | null>(null);

  const tableOrders = useMemo(() => orders.filter((o) => o.orderType === "table"), [orders]);
  const readyOrders = useMemo(() => tableOrders.filter((o) => o.status === "ready"), [tableOrders]);
  const activeOrders = useMemo(
    () => tableOrders.filter((o) => o.status !== "ready"),
    [tableOrders],
  );

  const openRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [requests],
  );
  const waiterCalls = openRequests.filter((r) => r.type === "waiter");
  const otherRequests = openRequests.filter((r) => r.type !== "waiter");

  const serve = async (order: Order) => {
    setBusyId(order.id);
    try {
      await orderService.update(order.id, { status: "served" });
      await refetch();
      toast(`${tableNameOf(order)} served`, { tone: "success" });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't serve — try again", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const resolve = async (req: ServiceRequest) => {
    setBusyId(req.id);
    try {
      await resolveRequest(req.id);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Waiter station</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            Your tables &amp; requests ·
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                connected ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40",
              )}
            />
            {connected ? "Live" : "Reconnecting…"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Guest requests */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <Bell className="size-5 text-brand" />
          Guest requests
          {openRequests.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {openRequests.length} waiting
            </span>
          )}
        </h2>
        {openRequests.length === 0 ? (
          <EmptyState
            icon={ConciergeBell}
            title="No open requests"
            description="Call-waiter and pay-bill alerts appear here with a live waiting timer."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {[...waiterCalls, ...otherRequests].map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                busy={busyId === req.id}
                onResolve={() => void resolve(req)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ready to serve */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <Utensils className="size-5 text-accent" />
          Ready to serve
        </h2>
        {readyOrders.length === 0 ? (
          <EmptyState
            title="Nothing ready yet"
            description="Table orders marked ready in the kitchen will show up here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {readyOrders.map((order) => (
              <Card key={order.id} className="border-brand/20 bg-brand-tint/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{tableNameOf(order)}</CardTitle>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Ready
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="text-sm">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    disabled={busyId === order.id}
                    onClick={() => void serve(order)}
                  >
                    Serve
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Active table orders */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Active orders</h2>
        {activeOrders.length === 0 ? (
          <EmptyState
            title="No active table orders"
            description="In-venue orders in progress will appear here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{tableNameOf(order)}</CardTitle>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.orderNumber} · {formatCurrency(order.total)}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground">
                    {order.items.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                    {order.items.length > 4 && <li>+{order.items.length - 4} more</li>}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RequestCard({
  request,
  busy,
  onResolve,
}: {
  request: ServiceRequest;
  busy?: boolean;
  onResolve: () => void;
}) {
  const isWaiter = request.type === "waiter";
  const Icon = isWaiter ? ConciergeBell : Receipt;

  return (
    <Card
      className={
        isWaiter
          ? "border-amber-300 bg-accent-tint/50 ring-1 ring-amber-200"
          : "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200"
      }
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex gap-3">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
              isWaiter ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">Table {request.tableLabel}</p>
            <p className="text-sm text-muted-foreground">
              {REQUEST_LABELS[request.type] ?? request.type}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              Waiting <ElapsedTimer since={request.createdAt} className="text-ink" />
            </p>
          </div>
        </div>
        <Button size="sm" disabled={busy} onClick={onResolve}>
          Resolve
        </Button>
      </CardContent>
    </Card>
  );
}
