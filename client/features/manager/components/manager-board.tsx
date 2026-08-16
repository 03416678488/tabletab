"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import {
  OrderActionDialog,
  type ManagerAction,
} from "@/features/manager/components/order-action-dialog";
import { ReservationsPanel } from "@/features/manager/components/reservations-panel";
import { ElapsedTimer } from "@/features/ops/components/elapsed-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusPill, StatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderBoard } from "@/features/order/hooks/use-order-board";
import { useServiceRequests } from "@/features/service-request/hooks/use-service-requests";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { orderService } from "@/features/order/services/order.service";
import type { Order, OrderStatus } from "@/features/order/types/order.types";
import { isSlaBreached } from "@/lib/utils";
import { cn, formatCurrency } from "@/lib/utils";

/** Orders still on the floor (excludes terminal + awaiting-payment states). */
const ACTIVE_STATUSES = new Set<OrderStatus>([
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "out-for-delivery",
  "served",
]);

const orderName = (o: Order) => o.customerName ?? o.customer?.name ?? "Walk-in";
const orderLocation = (o: Order) => o.table?.name ?? (o.orderType === "online" ? "Online" : "—");

export function ManagerBoard() {
  // Follow the topbar branch switcher — "All branches" shows every branch.
  const branchId = useScopedBranchId();
  // Real, live order board (SSE + poll) — already branch-scoped internally.
  const { orders, loading, error, refetch, connected } = useOrderBoard();
  // Real, live service-request queue (call waiter / ready to pay from QR scans).
  const { requests, resolve: resolveRequest } = useServiceRequests(branchId);
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<ManagerAction | null>(null);

  const activeOrders = useMemo(
    () =>
      orders
        .filter((o) => ACTIVE_STATUSES.has(o.status))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

  const slaBreaches = useMemo(
    () => activeOrders.filter((o) => isSlaBreached({ status: o.status, placedAt: o.createdAt })),
    [activeOrders],
  );

  const openRequests = useMemo(() => requests.filter((r) => !r.resolved), [requests]);

  const openAction = (order: Order, action: ManagerAction) => {
    setActionOrder(order);
    setActionType(action);
  };

  const handleConfirm = async (payload: {
    action: ManagerAction;
    reason: string;
    status?: OrderStatus;
  }) => {
    if (!actionOrder) return;
    try {
      if (payload.action === "cancel") {
        await orderService.update(actionOrder.id, {
          status: "cancelled",
          cancellationReason: payload.reason,
        });
      } else if (payload.action === "override" && payload.status) {
        await orderService.update(actionOrder.id, { status: payload.status });
      }
      await refetch();
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Floor overview</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {activeOrders.length} active orders ·
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

      <ReservationsPanel />

      {/* Escalations */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <ShieldAlert className="size-5 text-red-600" />
          Escalations
          {(slaBreaches.length > 0 || openRequests.length > 0) && (
            <StatusPill tone="red">{slaBreaches.length + openRequests.length} open</StatusPill>
          )}
        </h2>
        {slaBreaches.length === 0 && openRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No escalations — all orders within SLA and no open service requests.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {slaBreaches.map((order) => (
              <EscalationCard
                key={order.id}
                variant="sla"
                title={`SLA breach · ${order.orderNumber}`}
                subtitle={orderLocation(order)}
                since={order.createdAt}
                note="Unacknowledged for 5+ minutes"
                onAction={() => openAction(order, "override")}
              />
            ))}
            {openRequests.map((req) => (
              <EscalationCard
                key={req.id}
                variant="manager"
                title={`${req.type === "bill" ? "Ready to pay" : "Call waiter"} · Table ${req.tableLabel}`}
                subtitle={
                  req.type === "bill" ? "Guest is ready to pay" : "Guest requested a waiter"
                }
                since={req.createdAt}
                onResolve={() => {
                  void resolveRequest(req.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Live floor */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Active orders</h2>
        {activeOrders.length === 0 ? (
          <EmptyState title="Floor is quiet" description="No active orders right now." />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Timer</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map((order) => {
                    const sla = isSlaBreached({ status: order.status, placedAt: order.createdAt });
                    return (
                      <tr
                        key={order.id}
                        className={cn(
                          "border-b border-border/60 transition-colors hover:bg-subtle/80",
                          sla && "bg-red-50/80",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{order.orderNumber}</div>
                          <div className="text-xs text-muted-foreground">{orderName(order)}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{orderLocation(order)}</td>
                        <td className="px-4 py-3">
                          <StatusPill
                            tone={order.orderType === "online" ? "amber" : "brand"}
                            dot={false}
                          >
                            {order.orderType === "online" ? "Online" : "Dine-in"}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusPill status={order.status} dot={false} />
                          {sla && (
                            <AlertTriangle
                              className="mt-1 inline size-3.5 text-red-500"
                              aria-label="SLA breach"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ElapsedTimer
                            since={order.createdAt}
                            className="text-ink"
                            slaBreached={sla}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAction(order, "override")}
                            >
                              Override
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openAction(order, "cancel")}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      <OrderActionDialog
        order={actionOrder}
        action={actionType}
        open={!!actionOrder && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setActionOrder(null);
            setActionType(null);
          }
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function EscalationCard({
  variant,
  title,
  subtitle,
  since,
  note,
  onAction,
  onResolve,
}: {
  variant: "sla" | "manager";
  title: string;
  subtitle: string;
  since: string;
  note?: string;
  onAction?: () => void;
  onResolve?: () => void;
}) {
  return (
    <Card
      className={cn(
        variant === "sla"
          ? "border-red-300 bg-red-50/80 ring-1 ring-red-200"
          : "border-amber-300 bg-accent-tint/60 ring-1 ring-amber-200",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {variant === "sla" ? (
            <AlertTriangle className="size-4 text-red-600" />
          ) : (
            <ShieldAlert className="size-4 text-amber-700" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {note && <p className="text-sm font-medium text-ink">{note}</p>}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Open <ElapsedTimer since={since} className="text-ink" slaBreached={variant === "sla"} />
        </p>
        <div className="flex gap-2 pt-1">
          {onAction && (
            <Button size="sm" variant="outline" onClick={onAction}>
              Override status
            </Button>
          )}
          {onResolve && (
            <Button size="sm" onClick={onResolve}>
              Resolve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
