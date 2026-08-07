"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStorefrontSync } from "@/features/storefront/hooks/use-storefront-sync";
import { Banknote, CreditCard, MapPin, ShoppingBag, Truck, UtensilsCrossed, Wallet } from "lucide-react";
import { CartSummary } from "@/features/order/components/cart-summary";
import { AddressForm } from "@/features/storefront/components/address-form";
import { usePaymentMethods } from "@/features/storefront/hooks/use-payment-methods";
import { CheckoutPaymentDialog } from "@/features/storefront/components/checkout-payment-dialog";

// Read-only map for the selected delivery address (Leaflet → client-only).
const AddressMap = dynamic(() => import("@/features/storefront/components/address-map"), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-xl bg-secondary" />,
});
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useDineIn } from "@/hooks/use-dine-in";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { toast } from "@/hooks/use-toast";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";
import { branchOnlineConfig } from "@/features/storefront/services/storefront-branches";
import { placeStorefrontOrder } from "@/features/storefront/services/storefront-orders";
import { validatePromotionCode } from "@/features/promotion/services/storefront-promotions";
import type { Address } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const PAYMENT_ICONS: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  razorpay: CreditCard,
  cod: Banknote,
};

function CheckoutContent() {
  const router = useRouter();
  const user = useCustomerSession((s) => s.user);
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);
  const addAddress = useCustomerSession((s) => s.addAddress);
  const updateAddress = useCustomerSession((s) => s.updateAddress);

  const branchId = useCart((s) => s.branchId);
  const items = useCart((s) => s.items);
  const fulfillmentType = useCart((s) => s.fulfillmentType);
  const setFulfillmentType = useCart((s) => s.setFulfillmentType);
  const subtotal = useCart((s) => s.subtotal());
  const tax = useCart((s) => s.tax());
  const clear = useCart((s) => s.clear);

  // QR dine-in session — when active for this branch, checkout places a "table"
  // order (no delivery/pickup/address) instead of an online one.
  const dineIn = useDineIn();
  const isDineIn = dineIn.active && dineIn.branchId === branchId;
  const [guestName, setGuestName] = useState("");

  // Payment methods (enabled ones only; no secrets). Dine-in pays at the table.
  const { methods: paymentMethods } = usePaymentMethods();
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const selectedPayment = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Promo code — validated server-side against the live subtotal. The applied
  // discount is a preview; the server re-validates authoritatively on placement.
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(
    null,
  );
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  // Cached branches (React Query) — branch + online config derived reactively.
  const { branches, isLoading: branchesLoading } = useStorefrontBranches();
  const branch = useMemo(
    () => (branchId ? branches.find((b) => b.id === branchId) ?? null : null),
    [branches, branchId],
  );
  const online = useMemo(() => (branch ? branchOnlineConfig(branch) : null), [branch]);
  const loading = Boolean(branchId) && branchesLoading;
  const [paying, setPaying] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Default to the customer's default (or first) address until they pick one.
  const effectiveAddressId =
    selectedAddressId ??
    (user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0])?.id ??
    null;
  const selectedAddress = user?.addresses.find((a) => a.id === effectiveAddressId) ?? null;

  // Default fulfillment + pickup slot once the branch config resolves; on later
  // (live) config changes, move the guest off a mode staff just disabled.
  const defaultedRef = useRef(false);
  useEffect(() => {
    if (!online) return;
    if (!defaultedRef.current) {
      defaultedRef.current = true;
      if (online.deliveryAvailable) setFulfillmentType("delivery");
      else if (online.pickupAvailable) setFulfillmentType("pickup");
    } else if (fulfillmentType === "delivery" && !online.deliveryAvailable && online.pickupAvailable) {
      setFulfillmentType("pickup");
    } else if (fulfillmentType === "pickup" && !online.pickupAvailable && online.deliveryAvailable) {
      setFulfillmentType("delivery");
    }
    if (!pickupTime && online.pickupSlots[0]) setPickupTime(online.pickupSlots[0]);
  }, [online, fulfillmentType, pickupTime, setFulfillmentType]);

  // Live branch updates refetch the cached branches, re-deriving the config.
  useStorefrontSync();

  const deliveryFee = isDineIn
    ? 0
    : fulfillmentType === "delivery" && online?.deliveryAvailable
      ? online.deliveryFee
      : 0;
  const discount = appliedPromo?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee + tax - discount);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const result = await validatePromotionCode({ code, subtotal, customerId: user?.id });
      if (result.valid) {
        setAppliedPromo({ code: code.toUpperCase(), discountAmount: result.discountAmount });
        toast("Promo applied", { tone: "success" });
      } else {
        setAppliedPromo(null);
        setPromoError(result.reason ?? "This code can't be applied");
      }
    } catch {
      setPromoError("Couldn't check that code — try again");
    } finally {
      setPromoBusy(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  };

  // Keep the applied discount in sync with the cart: re-validate when the
  // subtotal changes (an edit may push it below the promo's minimum).
  useEffect(() => {
    if (!appliedPromo) return;
    let off = false;
    validatePromotionCode({ code: appliedPromo.code, subtotal, customerId: user?.id })
      .then((r) => {
        if (off) return;
        if (r.valid) setAppliedPromo((p) => (p ? { ...p, discountAmount: r.discountAmount } : p));
        else {
          setAppliedPromo(null);
          setPromoError(r.reason ?? "Promo no longer applies");
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const handleSaveAddress = async (address: Omit<Address, "id">) => {
    setSavingAddress(true);
    try {
      await addAddress(address);
      setShowAddressForm(false);
      toast("Address saved", { tone: "success" });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    await updateAddress(id, { isDefault: true });
    setSelectedAddressId(id);
    toast("Default address updated", { tone: "success" });
  };

  const handlePay = async () => {
    if (!branchId || items.length === 0) return;

    // Dine-in (QR): guest-friendly — no account required, no address/fee.
    if (isDineIn) {
      setPaying(true);
      try {
        const order = await placeStorefrontOrder({
          branchId,
          orderType: "table",
          tableId: dineIn.tableId ?? undefined,
          items,
          customerId: user?.id,
          customerName: guestName.trim() || user?.name || "Table guest",
          customerPhone: user?.phone || undefined,
          promotionCode: appliedPromo?.code,
          paymentStatus: "unpaid", // dine-in pays at the table
          tax,
          deliveryFee: 0,
          notes: [`Dine-in · Table ${dineIn.tableName ?? ""}`.trim(), note.trim()]
            .filter(Boolean)
            .join("\n") || undefined,
        });
        clear();
        toast("Order sent to the kitchen!", { tone: "success" });
        router.push(`/track/${order.id}`);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not place order — please try again", {
          tone: "error",
        });
      } finally {
        setPaying(false);
      }
      return;
    }

    if (!user) return;
    if (fulfillmentType === "delivery" && !effectiveAddressId) {
      toast("Select a delivery address", { tone: "error" });
      return;
    }
    if (fulfillmentType === "pickup" && !pickupTime) {
      toast("Select a pickup time", { tone: "error" });
      return;
    }
    if (!paymentMethodId || !selectedPayment?.enabled) {
      toast("Select a payment method", { tone: "error" });
      return;
    }

    // Cash on delivery has nothing to charge now — place the order directly.
    // Card / wallet methods collect payment first, then place the order.
    if (paymentMethodId === "cod") {
      void placeOrder();
    } else {
      setPaymentDialogOpen(true);
    }
  };

  /** Create the order — called after a successful (simulated) card charge, or
      directly for cash on delivery. `cardLast4` annotates the payment method. */
  const placeOrder = async (cardLast4?: string) => {
    if (!user || !branchId) return;

    // Format the chosen delivery address into a single line for the order.
    const selectedAddr = user.addresses.find((a) => a.id === effectiveAddressId);
    const addressText =
      fulfillmentType === "delivery" && selectedAddr
        ? [selectedAddr.line1, selectedAddr.line2, selectedAddr.city, selectedAddr.postalCode]
            .filter(Boolean)
            .join(", ")
        : undefined;
    const paymentLabel = selectedPayment
      ? cardLast4
        ? `${selectedPayment.label} ···· ${cardLast4}`
        : selectedPayment.label
      : undefined;

    setPaying(true);
    try {
      const order = await placeStorefrontOrder({
        branchId,
        fulfillmentType: fulfillmentType === "delivery" ? "delivery" : "pickup",
        items,
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone || undefined,
        customerAddress: addressText,
        customerLat: fulfillmentType === "delivery" ? selectedAddr?.lat : undefined,
        customerLng: fulfillmentType === "delivery" ? selectedAddr?.lng : undefined,
        paymentMethod: paymentLabel,
        // Card/wallet charged now = paid; cash on delivery = unpaid.
        paymentStatus: paymentMethodId === "cod" ? "unpaid" : "paid",
        promotionCode: appliedPromo?.code,
        tax,
        deliveryFee,
        notes:
          [
            fulfillmentType === "pickup" && pickupTime ? `Pickup at ${pickupTime}` : "",
            note.trim(),
          ]
            .filter(Boolean)
            .join("\n") || undefined,
      });
      clear();
      setPaymentDialogOpen(false);
      toast("Order placed!", { tone: "success" });
      router.push(`/track/${order.id}`);
    } catch (e) {
      setPaymentDialogOpen(false);
      toast(e instanceof Error ? e.message : "Payment failed — please try again", { tone: "error" });
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
              <Link href="/">Find a branch</Link>
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
        <p className="mt-1 text-muted-foreground">
          {isDineIn
            ? `Dine-in · Table ${dineIn.tableName} · ${branch.name}`
            : `Ordering from ${branch.name}`}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Dine-in (QR) — table context instead of delivery/pickup */}
          {isDineIn && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dine-in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand-tint/40 p-4">
                  <UtensilsCrossed className="size-5 shrink-0 text-brand" />
                  <div>
                    <p className="font-medium text-ink">Table {dineIn.tableName}</p>
                    <p className="text-sm text-muted-foreground">
                      {branch?.name} · served to your table
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guest-name">Your name (optional)</Label>
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Helps staff bring it to the right person"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {!isDineIn && (
            <>
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

          {/* Deliver to — needs an account */}
          {fulfillmentType === "delivery" && isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deliver to</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Map of the selected address — only when it has a pinned location. */}
                {!showAddressForm &&
                  selectedAddress?.lat != null &&
                  selectedAddress?.lng != null && (
                    <AddressMap lat={selectedAddress.lat} lng={selectedAddress.lng} />
                  )}
                {user?.addresses.length === 0 && !showAddressForm && (
                  <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
                )}
                {user?.addresses.map((addr: Address) => (
                  <div
                    key={addr.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedAddressId(addr.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedAddressId(addr.id);
                    }}
                    className={cn(
                      "w-full cursor-pointer rounded-xl border p-4 text-left text-sm transition-colors",
                      effectiveAddressId === addr.id
                        ? "border-brand bg-brand-tint"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} {addr.postalCode}
                    </p>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleSetDefault(addr.id);
                        }}
                        className="mt-2 text-xs font-medium text-brand hover:underline"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                ))}
                {showAddressForm ? (
                  <AddressForm
                    saving={savingAddress}
                    onCancel={() => setShowAddressForm(false)}
                    onSave={handleSaveAddress}
                  />
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
                          ? "border-brand bg-brand text-primary-foreground"
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
            </>
          )}

          {/* Payment method — for delivery/pickup (dine-in pays at the table) */}
          {!isDineIn && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No payment methods are available right now.
                  </p>
                ) : (
                  paymentMethods.map((m) => {
                    const Icon = PAYMENT_ICONS[m.id] ?? CreditCard;
                    const active = paymentMethodId === m.id;
                    // Disabled in Settings → Payment Gateways: show it, but greyed
                    // out and unselectable, so the option is discoverable.
                    const disabled = !m.enabled;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={disabled}
                        aria-disabled={disabled}
                        onClick={() => !disabled && setPaymentMethodId(m.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition-colors",
                          disabled
                            ? "cursor-not-allowed border-border bg-secondary/40 opacity-60"
                            : active
                              ? "border-brand bg-brand-tint"
                              : "border-border hover:bg-secondary",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            active && !disabled ? "border-brand" : "border-muted-foreground/40",
                          )}
                        >
                          {active && !disabled && <span className="size-2 rounded-full bg-brand" />}
                        </span>
                        <Icon className="size-5 shrink-0 text-brand" />
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{m.label}</p>
                          {disabled ? (
                            <p className="text-xs text-muted-foreground">Currently unavailable</p>
                          ) : (
                            m.id === "cod" &&
                            m.instructions && (
                              <p className="truncate text-xs text-muted-foreground">
                                {m.instructions}
                              </p>
                            )
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Optional order note */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a note (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="e.g. Ring the doorbell, no cutlery needed…"
                className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              <CartSummary
                deliveryFee={deliveryFee}
                discount={discount}
                promoLabel={appliedPromo?.code}
                showCheckout={false}
                compact
              />

              {/* Promo code */}
              <div className="mt-4 border-t border-border pt-4">
                {appliedPromo ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <span className="text-sm font-medium text-emerald-700">
                      {appliedPromo.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="text-xs font-medium text-emerald-700 underline hover:no-underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value);
                          setPromoError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void applyPromo();
                          }
                        }}
                        placeholder="Promo code"
                        aria-label="Promo code"
                        className="h-10 uppercase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void applyPromo()}
                        disabled={promoBusy || !promoInput.trim()}
                      >
                        {promoBusy ? "…" : "Apply"}
                      </Button>
                    </div>
                    {promoError && <p className="mt-1.5 text-xs text-destructive">{promoError}</p>}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {isAuthenticated || isDineIn ? (
            <>
              <Button
                className="w-full"
                size="lg"
                disabled={
                  paying ||
                  (!isDineIn &&
                    (!paymentMethodId ||
                      (fulfillmentType === "delivery" && !effectiveAddressId)))
                }
                onClick={handlePay}
              >
                {!isDineIn && <CreditCard className="size-4" />}
                {paying
                  ? "Processing…"
                  : isDineIn
                    ? `Place order · ${formatCurrency(total)}`
                    : `Pay now · ${formatCurrency(total)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {isDineIn
                  ? "Your order goes straight to the kitchen — pay at the table."
                  : "Mock payment — no card charged."}
              </p>
            </>
          ) : (
            <Card>
              <CardContent className="p-5 text-center">
                <p className="font-display font-semibold text-ink">Almost there!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in or create an account to place your order — your cart is saved.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/signin?returnUrl=/checkout">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href="/signup?returnUrl=/checkout">Create account</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Card / wallet payment — collect + (simulated) charge before placing. */}
      <CheckoutPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        method={selectedPayment}
        amount={total}
        processing={paying}
        onSuccess={({ last4 }) => void placeOrder(last4)}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutContent />;
}
