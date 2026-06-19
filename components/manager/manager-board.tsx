"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import {
  OrderActionDialog,
  type ManagerAction,
} from "@/components/manager/order-action-dialog";
import { ReservationsPanel } from "@/components/manager/reservations-panel";
import { ElapsedTimer } from "@/components/ops/elapsed-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusPill, StatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveOps } from "@/hooks/use-live-ops";
import { useSession } from "@/hooks/use-session";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { orderTableLabel } from "@/lib/order-display";
import type { Order, OrderStatus, StaffUser } from "@/lib/types";
import { isSlaBreached } from "@/lib/utils";
import { cn, formatCurrency } from "@/lib/utils";

const ACTIVE_STATUSES = new Set([
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out-for-delivery",
  "served",
]);

export function ManagerBoard() {
  const activeBranch = useSession((s) => s.activeBranch);
  const { orders, requests, loading, error, refresh } = useLiveOps({
    branchId: activeBranch.id,
    simulateOrders: true,
    simulateRequests: true,
  });
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<ManagerAction | null>(null);

  useEffect(() => {
    api.getStaff().then(setStaff);
  }, []);

  const activeOrders = useMemo(
    () =>
      orders
        .filter((o) => ACTIVE_STATUSES.has(o.status))
        .sort(
          (a, b) =>
            new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime(),
        ),
    [orders],
  );

  const slaBreaches = useMemo(
    () => activeOrders.filter((o) => isSlaBreached(o)),
    [activeOrders],
  );

  const managerCalls = useMemo(
    () =>
      requests.filter((r) => r.type === "manager" && !r.resolved),
    [requests],
  );

  const openAction = (order: Order, action: ManagerAction) => {
    setActionOrder(order);
    setActionType(action);
  };

  const handleConfirm = async (payload: {
    action: ManagerAction;
    reason: string;
    status?: OrderStatus;
    staffId?: string;
  }) => {
    if (!actionOrder) return;
    if (payload.action === "cancel") {
      await api.cancelOrder(actionOrder.id, payload.reason);
      toast("Order cancelled", { tone: "success" });
    } else if (payload.action === "override" && payload.status) {
      await api.overrideOrder(actionOrder.id, payload.status, payload.reason);
      toast("Status overridden", { tone: "success" });
    } else if (payload.action === "reassign" && payload.staffId) {
      await api.reassignOrder(actionOrder.id, payload.staffId, payload.reason);
      toast("Order reassigned", { tone: "success" });
    }
    await refresh();
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Floor overview</h1>
          <p className="text-sm text-muted-foreground">
            {activeBranch.name.replace("Olive & Ash — ", "")} · {activeOrders.length} active
            orders
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
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
          {(slaBreaches.length > 0 || managerCalls.length > 0) && (
            <StatusPill tone="red">{slaBreaches.length + managerCalls.length} open</StatusPill>
          )}
        </h2>
        {slaBreaches.length === 0 && managerCalls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No escalations — all orders within SLA and no manager calls.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {slaBreaches.map((order) => (
              <EscalationCard
                key={order.id}
                variant="sla"
                title={`SLA breach · ${order.reference}`}
                subtitle={orderTableLabel(order, activeBranch)}
                since={order.placedAt}
                note="Unacknowledged for 5+ minutes"
                onAction={() => openAction(order, "override")}
              />
            ))}
            {managerCalls.map((req) => (
              <EscalationCard
                key={req.id}
                variant="manager"
                title={`Call manager · Table ${req.tableLabel}`}
                subtitle={req.note ?? "Guest requested manager"}
                since={req.createdAt}
                onResolve={() =>
                  api.resolveServiceRequest(req.id).then(() => {
                    toast("Request resolved", { tone: "success" });
                    refresh();
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Live floor */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Active orders</h2>
        {activeOrders.length === 0 ? (
          <EmptyState title="Floor is quiet" description="No active orders at this branch." />
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
                    const sla = isSlaBreached(order);
                    const assigned = staff.find((s) => s.id === order.assignedToStaffId);
                    return (
                      <tr
                        key={order.id}
                        className={cn(
                          "border-b border-border/60 transition-colors hover:bg-subtle/80",
                          sla && "bg-red-50/80",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{order.reference}</div>
                          <div className="text-xs text-muted-foreground">{order.customerName}</div>
                          {assigned && (
                            <div className="mt-0.5 text-xs text-brand">→ {assigned.name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {orderTableLabel(order, activeBranch)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone={order.channel === "in-venue" ? "brand" : "amber"} dot={false}>
                            {order.channel === "in-venue" ? "Dine-in" : "Online"}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusPill status={order.status} dot={false} />
                          {sla && (
                            <AlertTriangle className="mt-1 inline size-3.5 text-red-500" aria-label="SLA breach" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ElapsedTimer
                            since={order.acceptedAt ?? order.placedAt}
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
                              onClick={() => openAction(order, "reassign")}
                            >
                              Reassign
                            </Button>
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
        staff={staff}
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
          Open{" "}
          <ElapsedTimer since={since} className="text-ink" slaBreached={variant === "sla"} />
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
