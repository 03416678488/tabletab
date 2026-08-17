"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Order, OrderStatus } from "@/features/order/types/order.types";
import { cn } from "@/lib/utils";

export type ManagerAction = "cancel" | "override";

const OVERRIDE_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
  { value: "completed", label: "Completed" },
];

interface OrderActionDialogProps {
  order: Order | null;
  action: ManagerAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: {
    action: ManagerAction;
    reason: string;
    status?: OrderStatus;
  }) => Promise<void>;
}

export function OrderActionDialog({
  order,
  action,
  open,
  onOpenChange,
  onConfirm,
}: OrderActionDialogProps) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<OrderStatus>("preparing");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReason("");
    setStatus("preparing");
    setError("");
  };

  const titles: Record<ManagerAction, string> = {
    cancel: "Cancel order",
    override: "Override status",
  };

  const handleSubmit = async () => {
    if (!action || !reason.trim()) {
      setError("A reason is required for the audit trail.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onConfirm({
        action,
        reason: reason.trim(),
        status: action === "override" ? status : undefined,
      });
      reset();
      onOpenChange(false);
    } catch {
      setError("Action failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>{action ? titles[action] : "Order action"}</SheetTitle>
          <SheetDescription>
            {order?.orderNumber} · {order?.customerName ?? order?.customer?.name ?? "Walk-in"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6">
          {action === "override" && (
            <div className="space-y-2">
              <Label>New status</Label>
              <div className="grid grid-cols-2 gap-2">
                {OVERRIDE_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      status === s.value
                        ? "border-brand bg-brand-tint text-brand-deep"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required for audit log…"
              rows={3}
              className="w-full rounded-xl border border-input px-3.5 py-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button
            variant={action === "cancel" ? "destructive" : "default"}
            className="w-full"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Saving…" : "Confirm"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
