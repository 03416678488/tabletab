"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, ShoppingBag, Truck } from "lucide-react";
import { CartSummary } from "@/components/order/cart-summary";
import { AuthGuard } from "@/components/storefront/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import type { Address, Branch } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

function CheckoutContent() {
  const router = useRouter();
  const user = useCustomerSession((s) => s.user);
  const addAddress = useCustomerSession((s) => s.addAddress);

  const branchId = useCart((s) => s.branchId);
  const items = useCart((s) => s.items);
  const fulfillmentType = useCart((s) => s.fulfillmentType);
  const setFulfillmentType = useCart((s) => s.setFulfillmentType);
  const subtotal = useCart((s) => s.subtotal());
  const tax = useCart((s) => s.tax());
  const clear = useCart((s) => s.clear);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [online, setOnline] = useState<BranchOnlineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "Portland",
    postalCode: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!user?.addresses.length) return;
    const defaultAddr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
    setSelectedAddressId(defaultAddr.id);
  }, [user]);

  useEffect(() => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [b, cfg] = await Promise.all([
          api.getBranch(branchId),
          api.getBranchOnlineConfig(branchId),
        ]);
        if (!cancelled) {
          setBranch(b ?? null);
          setOnline(cfg);
          if (cfg.deliveryAvailable) {
            setFulfillmentType("delivery");
          } else if (cfg.pickupAvailable) {
            setFulfillmentType("pickup");
          }
          if (cfg.pickupSlots[0]) setPickupTime(cfg.pickupSlots[0]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId, setFulfillmentType]);

  const deliveryFee =
    fulfillmentType === "delivery" && online?.deliveryAvailable ? online.deliveryFee : 0;
  const total = subtotal + deliveryFee + tax;

  const handleAddAddress = async () => {
    if (!newAddress.line1.trim() || !newAddress.postalCode.trim()) {
      toast("Please fill in address fields", { tone: "error" });
      return;
    }
    await addAddress(newAddress);
    setShowAddressForm(false);
    toast("Address saved", { tone: "success" });
  };

  const handlePay = async () => {
    if (!user || !branchId || items.length === 0) return;
    if (fulfillmentType === "delivery" && !selectedAddressId) {
      toast("Select a delivery address", { tone: "error" });
      return;
    }
    if (fulfillmentType === "pickup" && !pickupTime) {
      toast("Select a pickup time", { tone: "error" });
      return;
    }

    setPaying(true);
    try {
      const order = await api.createOrder({
        branchId,
        fulfillmentType: fulfillmentType === "delivery" ? "delivery" : "pickup",
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          modifiers: i.modifiers,
          notes: i.notes,
        })),
        customerId: user.id,
        customerName: user.name,
        deliveryAddressId: fulfillmentType === "delivery" ? selectedAddressId ?? undefined : undefined,
        pickupTime: fulfillmentType === "pickup" ? pickupTime ?? undefined : undefined,
        subtotal,
        deliveryFee,
        tax,
        total,
      });
      clear();
      toast("Order placed!", { tone: "success" });
      router.push(`/track/${order.id}`);
    } catch {
      toast("Payment failed — please try again", { tone: "error" });
    } finally {
      setPaying(false);
    }
  };

  if (!branchId || items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to checkout"
          description="Add items to your cart from a branch menu first."
          action={
            <Button asChild>
              <Link href="/order">Find a branch</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Checkout</h1>
      {branch && (
        <p className="mt-1 text-muted-foreground">Ordering from {branch.name}</p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Fulfillment type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How would you like it?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {online?.deliveryAvailable && (
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-4 text-left transition-colors",
                    fulfillmentType === "delivery"
                      ? "border-brand bg-brand-tint"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <Truck className="mb-2 size-5 text-brand" />
                  <span className="font-medium">Delivery</span>
                  <span className="text-sm text-muted-foreground">
                    ~{online.deliveryEtaMinutes} min · {formatCurrency(online.deliveryFee)} fee
                  </span>
                </button>
              )}
              {online?.pickupAvailable && (
                <button
                  type="button"
                  onClick={() => setFulfillmentType("pickup")}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-4 text-left transition-colors",
                    fulfillmentType === "pickup"
                      ? "border-brand bg-brand-tint"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <MapPin className="mb-2 size-5 text-brand" />
                  <span className="font-medium">Pickup</span>
                  <span className="text-sm text-muted-foreground">Ready in ~15 min</span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Delivery address */}
          {fulfillmentType === "delivery" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user?.addresses.length === 0 && !showAddressForm && (
                  <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
                )}
                {user?.addresses.map((addr: Address) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left text-sm transition-colors",
                      selectedAddressId === addr.id
                        ? "border-brand bg-brand-tint"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    <p className="font-medium">{addr.label}</p>
                    <p className="text-muted-foreground">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} {addr.postalCode}
                    </p>
                  </button>
                ))}
                {showAddressForm ? (
                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="addr-label">Label</Label>
                        <Input
                          id="addr-label"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="addr-postal">Postal code</Label>
                        <Input
                          id="addr-postal"
                          value={newAddress.postalCode}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, postalCode: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="addr-line1">Street address</Label>
                      <Input
                        id="addr-line1"
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleAddAddress}>
                        Save address
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowAddressForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setShowAddressForm(true)}>
                    Add new address
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pickup time */}
          {fulfillmentType === "pickup" && online && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pickup time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {online.pickupSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPickupTime(slot)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        pickupTime === slot
                          ? "border-brand bg-brand text-white"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              <CartSummary deliveryFee={deliveryFee} showCheckout={false} compact />
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={paying}
            onClick={handlePay}
          >
            <CreditCard className="size-4" />
            {paying ? "Processing…" : `Pay now · ${formatCurrency(total)}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Mock payment — no card charged.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
