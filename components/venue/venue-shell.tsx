"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CallWaiterFab } from "@/components/venue/call-waiter-fab";
import { PlaceOrderSheet } from "@/components/venue/place-order-sheet";
import { VenueCartDrawer } from "@/components/venue/venue-cart-drawer";
import { VenueHeader } from "@/components/venue/venue-header";
import { VenueOrderStatus } from "@/components/venue/venue-order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useVenueStore } from "@/hooks/use-venue-store";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export function VenueShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const token = params.token as string;
  const hydrated = useVenueStore((s) => s.hydrated);
  const initTable = useVenueStore((s) => s.initTable);
  const items = useVenueStore((s) => s.items);
  const buffet = useVenueStore((s) => s.buffet);
  const branchId = useVenueStore((s) => s.branchId);
  const tableId = useVenueStore((s) => s.tableId);
  const customerName = useVenueStore((s) => s.customerName);
  const setCustomerName = useVenueStore((s) => s.setCustomerName);
  const clearCart = useVenueStore((s) => s.clearCart);
  const setActiveOrderId = useVenueStore((s) => s.setActiveOrderId);
  const subtotal = useVenueStore((s) => s.subtotal);
  const tax = useVenueStore((s) => s.tax);
  const total = useVenueStore((s) => s.total);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resolved = await api.resolveTableToken(token);
        if (!resolved) {
          if (!cancelled) setError("This table link is invalid or expired.");
          return;
        }
        if (!cancelled) {
          initTable(token, resolved.branch, resolved.table);
          const existing = await api.getTableActiveOrder(resolved.table.id);
          if (existing) setActiveOrderId(existing.id);
        }
      } catch {
        if (!cancelled) setError("Could not load table. Please scan again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, initTable, setActiveOrderId]);

  const handlePlaceOrder = async (name: string) => {
    if (!branchId || !tableId || (items.length === 0 && !buffet)) return;
    setCustomerName(name);
    setPlacing(true);
    try {
      const order = await api.createVenueOrder({
        branchId,
        tableId,
        customerName: name,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          modifiers: i.modifiers,
          notes: i.notes,
        })),
        buffet: buffet ?? undefined,
        subtotal: subtotal(),
        tax: tax(),
        total: total(),
      });
      setActiveOrderId(order.id);
      clearCart();
      setPlaceOpen(false);
      toast("Order sent to the kitchen!", { tone: "success", duration: 4000 });
    } catch {
      toast("Could not place order", { tone: "error" });
    } finally {
      setPlacing(false);
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-subtle">
        <Skeleton className="h-14 w-full" />
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-full rounded-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-subtle p-6">
        <EmptyState title="Table not found" description={error} />
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-dvh max-w-lg bg-subtle">
      <VenueHeader />
      <VenueOrderStatus />
      {children}
      <VenueCartDrawer
        onCheckout={() => {
          if (items.length === 0 && !buffet) return;
          if (customerName) {
            void handlePlaceOrder(customerName);
          } else {
            setPlaceOpen(true);
          }
        }}
      />
      <PlaceOrderSheet
        open={placeOpen}
        onOpenChange={setPlaceOpen}
        onPlace={handlePlaceOrder}
        placing={placing}
      />
      <CallWaiterFab />
    </div>
  );
}
