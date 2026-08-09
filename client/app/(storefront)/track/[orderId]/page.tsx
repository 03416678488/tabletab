"use client";

import { use, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  Check,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Store,
  Timer,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { OrderTimeline } from "@/features/order/components/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusPill, StatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchStorefrontOrder,
  type StorefrontOrder,
} from "@/features/storefront/services/storefront-orders";
import { useOrderStream } from "@/hooks/use-order-stream";
import { useDineIn } from "@/hooks/use-dine-in";
import { callWaiter } from "@/features/storefront/services/qr-ordering";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { toast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

// Read-only delivery-address map (Leaflet → client-only).
const AddressMap = dynamic(() => import("@/features/storefront/components/address-map"), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-xl bg-secondary" />,
});

// Safety-net reconcile poll — SSE delivers updates instantly; this only catches
// anything missed during a reconnect (and refreshes items/totals if they change).
const RECONCILE_INTERVAL_MS = 30_000;

const TERMINAL = new Set(["completed", "cancelled"]);

export default function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<StorefrontOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dine-in guests can summon a waiter straight from the tracking screen —
  // the QR slug from their active session is what identifies the table to staff.
  const dineSlug = useDineIn((s) => s.slug);
  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isLive = Boolean(order) && !TERMINAL.has(order?.status ?? "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await fetchStorefrontOrder(orderId);
        if (!cancelled) {
          if (!o) setError("Order not found");
          else setOrder(o);
        }
      } catch {
        if (!cancelled) setError("Could not load order");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Realtime status via SSE (primary).
  const onStatus = useCallback(
    ({ status }: { status: Order["status"] }) =>
      setOrder((prev) => (prev ? { ...prev, status } : prev)),
    [],
  );
  const { connected } = useOrderStream(orderId, onStatus, isLive);

  // Reconcile poll (fallback) — refetch the whole order periodically until done.
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(async () => {
      const updated = await fetchStorefrontOrder(orderId);
      if (updated) setOrder(updated);
    }, RECONCILE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLive, orderId]);

  const handleCallWaiter = async () => {
    if (!dineSlug || calling) return;
    // Already requested — just re-show the confirmation so the guest is reassured.
    if (called) {
      setConfirmOpen(true);
      return;
    }
    setCalling(true);
    try {
      await callWaiter(dineSlug);
      setCalled(true);
      setConfirmOpen(true);
    } catch {
      toast("Couldn't reach a waiter — please try again", { tone: "error" });
    } finally {
      setCalling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <EmptyState
          icon={Package}
          title={error ?? "Order not found"}
          action={
            <Button asChild variant="outline">
              <Link href="/">Place a new order</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <OrderStatusPill status={order.status} />
          <StatusPill tone={order.paymentStatus === "paid" ? "green" : "amber"}>
            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
          </StatusPill>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Order {order.reference}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.isDineIn
            ? `Dine-in${order.tableName ? ` · Table ${order.tableName}` : ""}`
            : order.fulfillmentType === "delivery"
              ? "Delivery"
              : "Pickup"}{" "}
          · {formatCurrency(order.total)}
        </p>
      </div>

      {/* Fulfillment + contact details. */}
      <Card className="mb-6">
        <CardContent className="space-y-3 p-4">
          {order.branchName && (
            <div className="flex items-start gap-3">
              <Store className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">From</p>
                <p className="text-sm text-muted-foreground">{order.branchName}</p>
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex items-start gap-3",
              order.branchName && "border-t border-border pt-3",
            )}
          >
            {order.isDineIn ? (
              <>
                <UtensilsCrossed className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Dine-in</p>
                  <p className="text-sm text-muted-foreground">
                    {order.tableName
                      ? `Table ${order.tableName} · served to your table`
                      : "Served to your table"}
                  </p>
                </div>
              </>
            ) : order.fulfillmentType === "delivery" ? (
              <>
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Delivering to</p>
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress || "Address on file"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Pickup</p>
                  <p className="text-sm text-muted-foreground">
                    {order.pickupTime ? `Ready at ${order.pickupTime}` : "Collect in-store"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Map of the delivery location, when the address was pinned. */}
          {order.fulfillmentType === "delivery" &&
            typeof order.deliveryLat === "number" &&
            typeof order.deliveryLng === "number" && (
              <AddressMap lat={order.deliveryLat} lng={order.deliveryLng} />
            )}

          {order.fulfillmentType === "delivery" && (
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <Timer className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Estimated delivery</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const eta = order.deliveryEtaMinutes ?? 30;
                    const at = new Date(new Date(order.placedAt).getTime() + eta * 60_000);
                    return `~${at.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })} · about ${eta} min`;
                  })()}
                </p>
              </div>
            </div>
          )}

          {(order.customerName || order.customerPhone) && (
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <User className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Contact</p>
                <p className="text-sm text-muted-foreground">
                  {[order.customerName, order.customerPhone].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          )}

          {order.paymentMethod && (
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Payment</p>
                <p className="text-sm text-muted-foreground">{order.paymentMethod}</p>
              </div>
            </div>
          )}

          {order.note && (
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <MessageSquare className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Note</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{order.note}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 border-t border-border pt-3">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-ink">Placed</p>
              <p className="text-sm text-muted-foreground">
                {new Date(order.placedAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Order progress</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline status={order.status} fulfillmentType={order.fulfillmentType} />
          {isLive && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block size-2 rounded-full",
                  connected ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40",
                )}
              />
              {connected ? "Live — updates in real time" : "Reconnecting…"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Items
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              ({order.items.reduce((n, i) => n + i.quantity, 0)})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {order.isDineIn && dineSlug ? (
        // Dine-in: the guest is at the table — offer a waiter, not "order again".
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleCallWaiter}
            disabled={calling}
            className={cn(called && "bg-green-600 text-white hover:bg-green-600")}
          >
            {called ? (
              <Check className="size-4" />
            ) : calling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BellRing className="size-4" />
            )}
            {called ? "Waiter on the way" : "Call waiter"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Order again</Link>
          </Button>
          <Button asChild>
            <Link href="/account">View history</Link>
          </Button>
        </div>
      )}

      {/* Waiter-called confirmation — a clear, dismissible modal instead of a
          fleeting toast (easy to miss on a shared table phone). */}
      <SuccessDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={BellRing}
        title="A waiter is on the way"
        description={
          <>
            Someone will come to{" "}
            <span className="font-medium text-ink">
              {order.tableName ? `Table ${order.tableName}` : "your table"}
            </span>{" "}
            shortly. Hang tight!
          </>
        }
      />
    </div>
  );
}
