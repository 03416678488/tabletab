"use client";

import { useMemo, useState } from "react";
import { Bell, ConciergeBell, Plus, RefreshCw, Utensils } from "lucide-react";
import { AddItemSheet } from "@/components/waiter/add-item-sheet";
import { BuffetOrderSheet } from "@/components/waiter/buffet-order-sheet";
import { ElapsedTimer } from "@/components/ops/elapsed-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveOps } from "@/hooks/use-live-ops";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { orderTableLabel } from "@/lib/order-display";
import type { Order, ServiceRequest } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const REQUEST_LABELS: Record<string, string> = {
  waiter: "Call waiter",
  bill: "Request bill",
  water: "Water",
  manager: "Manager",
};

export function WaiterBoard() {
  const activeBranch = useSession((s) => s.activeBranch);
  const { orders, requests, loading, error, refresh } = useLiveOps({
    branchId: activeBranch.id,
    simulateOrders: true,
    simulateRequests: true,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addToOrder, setAddToOrder] = useState<Order | null>(null);
  const [buffetOrder, setBuffetOrder] = useState<Order | null | undefined>(undefined);

  const dineInOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.channel === "in-venue" &&
          o.fulfillmentType === "dine-in" &&
          !["completed", "cancelled"].includes(o.status),
      ),
    [orders],
  );

  const activeOrders = useMemo(
    () => dineInOrders.filter((o) => !["ready", "served"].includes(o.status)),
    [dineInOrders],
  );

  const readyOrders = useMemo(
    () => dineInOrders.filter((o) => o.status === "ready"),
    [dineInOrders],
  );

  const openRequests = useMemo(
    () =>
      requests
        .filter((r) => !r.resolved)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [requests],
  );

  const waiterCalls = openRequests.filter((r) => r.type === "waiter");
  const otherRequests = openRequests.filter((r) => r.type !== "waiter");

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await action();
      await refresh();
    } catch {
      toast("Action failed", { tone: "error" });
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Waiter station</h1>
          <p className="text-sm text-muted-foreground">
            {activeBranch.name.replace("Olive & Ash — ", "")} · Your tables &amp; requests
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setBuffetOrder(null)}>
            <Utensils className="size-4" />
            Walk-in buffet
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Call waiter requests */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <Bell className="size-5 text-brand" />
          Guest requests
          {waiterCalls.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {waiterCalls.length} waiting
            </span>
          )}
        </h2>
        {openRequests.length === 0 ? (
          <EmptyState
            icon={ConciergeBell}
            title="No open requests"
            description="Call waiter alerts will appear here with a live waiting timer."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {[...waiterCalls, ...otherRequests].map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                busy={busyId === req.id}
                onResolve={() =>
                  runAction(req.id, () => api.resolveServiceRequest(req.id))
                }
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
            description="Orders marked ready in the kitchen will show up here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {readyOrders.map((order) => (
              <Card key={order.id} className="border-brand/20 bg-brand-tint/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {orderTableLabel(order, activeBranch)}
                    </CardTitle>
                    <OrderStatusPill status={order.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{order.reference}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="text-sm">
                    {order.items.map((item, i) => (
                      <li key={i}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    disabled={busyId === order.id}
                    onClick={() =>
                      runAction(order.id, () => api.serveOrder(order.id))
                    }
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
                    <CardTitle className="text-base">
                      {orderTableLabel(order, activeBranch)}
                    </CardTitle>
                    <OrderStatusPill status={order.status} dot={false} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.reference} · {formatCurrency(order.total)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="text-sm text-muted-foreground">
                    {order.buffet && (
                      <li className="font-medium text-brand-deep">
                        Buffet · {order.buffet.totalCovers} covers
                      </li>
                    )}
                    {order.items.slice(0, 4).map((item, i) => (
                      <li key={i}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                    {order.items.length > 4 && (
                      <li>+{order.items.length - 4} more</li>
                    )}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setBuffetOrder(order)}
                  >
                    <Utensils className="size-4" />
                    {order.buffet ? "Change buffet" : "Add buffet"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAddToOrder(order)}
                  >
                    <Plus className="size-4" />
                    Add item
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AddItemSheet
        order={addToOrder}
        open={!!addToOrder}
        onOpenChange={(open) => !open && setAddToOrder(null)}
        onAdded={refresh}
      />

      <BuffetOrderSheet
        order={buffetOrder === undefined ? null : buffetOrder}
        open={buffetOrder !== undefined}
        onOpenChange={(open) => !open && setBuffetOrder(undefined)}
        onDone={refresh}
      />
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

  return (
    <Card
      className={
        isWaiter
          ? "border-amber-300 bg-accent-tint/50 ring-1 ring-amber-200"
          : undefined
      }
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="font-semibold text-ink">
            Table {request.tableLabel} · {REQUEST_LABELS[request.type] ?? request.type}
          </p>
          {request.note && (
            <p className="mt-1 text-sm text-muted-foreground">{request.note}</p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            Waiting{" "}
            <ElapsedTimer
              since={request.createdAt}
              className="text-ink"
            />
          </p>
        </div>
        <Button size="sm" disabled={busy} onClick={onResolve}>
          Resolve
        </Button>
      </CardContent>
    </Card>
  );
}
