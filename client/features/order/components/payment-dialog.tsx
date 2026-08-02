"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Delete, Loader2, Smartphone, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";

export type PaymentMethod = "cash" | "card" | "mfs" | "other";

export interface PaymentResult {
  method: PaymentMethod;
  /** Received (cash), last-4 (card), txn id (mfs), or note (other). */
  detail: string;
  received?: number;
  change?: number;
}

const METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "mfs", label: "MFS", icon: Smartphone },
  { value: "other", label: "Other", icon: Receipt },
];

const FIELD: Record<PaymentMethod, { label: string; numeric: boolean; placeholder: string }> = {
  cash: { label: "Enter Received Amount", numeric: true, placeholder: "0.00" },
  card: { label: "Enter Last 4 Digits Of Card", numeric: true, placeholder: "0000" },
  mfs: { label: "Enter Transaction ID", numeric: false, placeholder: "Transaction ID" },
  other: { label: "Enter Payment Note", numeric: false, placeholder: "Payment note" },
};

interface PaymentDialogProps {
  open: boolean;
  total: number;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: PaymentResult) => void;
}

export function PaymentDialog({
  open,
  total,
  submitting,
  onOpenChange,
  onConfirm,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      setMethod("cash");
      setValue("");
    }
  }, [open]);

  useEffect(() => setValue(""), [method]);

  const received = method === "cash" ? Number(value) || 0 : 0;
  const change = useMemo(
    () => (method === "cash" ? Math.max(0, received - total) : 0),
    [method, received, total],
  );

  const field = FIELD[method];
  const canConfirm =
    !submitting &&
    (method === "cash"
      ? received >= total && total > 0
      : method === "card"
        ? value.length >= 3
        : value.trim().length > 0);

  const press = (k: string) => {
    setValue((v) => {
      if (k === "." && v.includes(".")) return v;
      if (method === "card" && v.replace(/\D/g, "").length >= 4 && k !== "") return v;
      return v + k;
    });
  };
  const backspace = () => setValue((v) => v.slice(0, -1));
  const clear = () => setValue("");

  const confirm = () =>
    onConfirm({
      method,
      detail: value.trim(),
      ...(method === "cash" ? { received, change } : {}),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-10 max-w-md translate-y-0 gap-0 p-0">
        <div className="border-b border-border px-5 py-4 pr-12">
          <h2 className="font-display text-lg font-semibold text-ink">Order Payment</h2>
        </div>

        <div className="space-y-4 p-5">
          {/* Total */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-lg font-bold text-brand">{formatMoney(total)}</span>
          </div>

          {/* Methods */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Select Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
                      active
                        ? "border-brand bg-brand-tint/40 text-brand-deep"
                        : "border-border bg-card text-muted-foreground hover:border-brand/40",
                    )}
                  >
                    <Icon className="size-5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{field.label}</p>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.placeholder}
              inputMode={field.numeric ? "decimal" : "text"}
              className="h-12 text-center text-lg font-semibold"
            />
            {method === "cash" && received > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Change</span>
                <span className="font-semibold text-ink">{formatMoney(change)}</span>
              </div>
            )}
          </div>

          {/* Numeric keypad for cash/card */}
          {field.numeric && (
            <div className="grid grid-cols-4 gap-2">
              {["1", "2", "3"].map((k) => (
                <Key key={k} onClick={() => press(k)}>
                  {k}
                </Key>
              ))}
              <Key onClick={backspace} tone="dark">
                <Delete className="size-5" />
              </Key>
              {["4", "5", "6"].map((k) => (
                <Key key={k} onClick={() => press(k)}>
                  {k}
                </Key>
              ))}
              <Key onClick={clear}>Clear</Key>
              {["7", "8", "9"].map((k) => (
                <Key key={k} onClick={() => press(k)}>
                  {k}
                </Key>
              ))}
              <div />
              <Key onClick={() => press("00")}>00</Key>
              <Key onClick={() => press("0")}>0</Key>
              <Key onClick={() => press(".")}>.</Key>
              <div />
            </div>
          )}

          <Button className="h-12 w-full text-base" disabled={!canConfirm} onClick={confirm}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Confirm &amp; Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Key({
  children,
  onClick,
  tone = "light",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "light" | "dark";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center rounded-xl text-base font-semibold transition-colors",
        tone === "dark"
          ? "bg-ink text-white hover:bg-ink/90"
          : "bg-secondary text-ink hover:bg-secondary/70",
      )}
    >
      {children}
    </button>
  );
}
