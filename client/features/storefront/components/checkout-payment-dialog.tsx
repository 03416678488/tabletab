"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@/features/storefront/services/payment-methods";

export interface CardPaymentResult {
  /** Last 4 digits of the card (card methods only). */
  last4?: string;
}

/** PayPal is a redirect-style approval; everything else collects a card. */
function kindFor(id?: string): "card" | "redirect" {
  return id === "paypal" ? "redirect" : "card";
}

/** Luhn checksum — rejects mistyped card numbers. */
function luhnValid(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: PaymentMethod | null;
  amount: number;
  /** True while the order is being created after the (simulated) charge. */
  processing: boolean;
  onSuccess: (result: CardPaymentResult) => void;
}

/**
 * Collects card details (or a PayPal-style approval) and simulates the payment
 * gateway before the order is placed. TEST MODE — no real card is charged and
 * the card number never leaves the browser (only the last 4 are kept).
 */
export function CheckoutPaymentDialog({
  open,
  onOpenChange,
  method,
  amount,
  processing,
  onSuccess,
}: Props) {
  const kind = kindFor(method?.id);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNumber("");
      setExpiry("");
      setCvc("");
      setName("");
      setError(null);
      setCharging(false);
    }
  }, [open, method?.id]);

  const last4 = number.replace(/\D/g, "").slice(-4);

  // Per-field validity (drives the green/red field styling).
  const numberValid = luhnValid(number);
  const expiryValid = useMemo(() => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [mm, yy] = expiry.split("/").map(Number);
    if (mm < 1 || mm > 12) return false;
    return new Date(2000 + yy, mm, 1) > new Date(); // valid through the printed month
  }, [expiry]);
  const cvcValid = /^\d{3,4}$/.test(cvc);
  const nameValid = name.trim().length > 0;
  const validCard = kind !== "card" || (numberValid && expiryValid && cvcValid && nameValid);

  // Neutral focus while empty (never the brand colour, which can read as an
  // error); green once valid; red only once it's non-empty but wrong.
  const fieldClass = (value: string, valid: boolean) =>
    value.trim() === ""
      ? "focus-visible:border-slate-400 focus-visible:ring-slate-400/25"
      : valid
        ? "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
        : "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30";

  const formatNumber = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const busy = charging || processing;

  const submit = async () => {
    if (kind === "card" && !validCard) {
      setError("Please check your card details.");
      return;
    }
    setError(null);
    setCharging(true);
    // Simulate the payment gateway. Test mode — no real charge.
    await new Promise((r) => setTimeout(r, 1400));
    onSuccess({ last4: kind === "card" ? last4 : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-md gap-0 p-0">
        <div className="border-b border-border px-5 py-4 pr-12">
          <h2 className="font-display text-lg font-semibold text-ink">
            Pay with {method?.label ?? "card"}
          </h2>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-lg font-bold text-brand">{formatCurrency(amount)}</span>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <span>
              Test mode — use card <b>4242 4242 4242 4242</b>, any future expiry &amp; CVC. No real
              charge is made.
            </span>
          </div>

          {kind === "card" ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cc-name">Name on card</Label>
                <Input
                  id="cc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  disabled={busy}
                  className={fieldClass(name, nameValid)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cc-number">Card number</Label>
                <div className="relative">
                  <Input
                    id="cc-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={number}
                    onChange={(e) => setNumber(formatNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    disabled={busy}
                    className={cn("pr-9", fieldClass(number, numberValid))}
                  />
                  {numberValid && (
                    <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cc-exp">Expiry</Label>
                  <Input
                    id="cc-exp"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    disabled={busy}
                    className={fieldClass(expiry, expiryValid)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cc-cvc">CVC</Label>
                  <Input
                    id="cc-cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    disabled={busy}
                    className={fieldClass(cvc, cvcValid)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You&apos;ll approve this payment securely with {method?.label}. (Test mode —
              simulated, no real charge.)
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            size="lg"
            disabled={busy || (kind === "card" && !validCard)}
            onClick={submit}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Lock className="size-4" /> Pay {formatCurrency(amount)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
