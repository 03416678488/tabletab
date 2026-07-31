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
import type { Order, OrderStatus, StaffUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ManagerAction = "cancel" | "override" | "reassign";

const OVERRIDE_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
  { value: "completed", label: "Completed" },
];

interface OrderActionDialogProps {
  order: Order | null;
  action: ManagerAction | null;
  staff: StaffUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: {
    action: ManagerAction;
    reason: string;
    status?: OrderStatus;
    staffId?: string;
  }) => Promise<void>;
}

export function OrderActionDialog({
  order,
  action,
  staff,
  open,
  onOpenChange,
  onConfirm,
}: OrderActionDialogProps) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<OrderStatus>("preparing");
  const [staffId, setStaffId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReason("");
    setStatus("preparing");
    setStaffId("");
    setError("");
  };

  const titles: Record<ManagerAction, string> = {
    cancel: "Cancel order",
    override: "Override status",
    reassign: "Reassign order",
  };

  const handleSubmit = async () => {
    if (!action || !reason.trim()) {
      setError("A reason is required for audit trail.");
      return;
    }
    if (action === "reassign" && !staffId) {
      setError("Select a staff member.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onConfirm({
        action,
        reason: reason.trim(),
        status: action === "override" ? status : undefined,
        staffId: action === "reassign" ? staffId : undefined,
      });
      reset();
      onOpenChange(false);
    } catch {
      setError("Action failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const waiters = staff.filter((s) => s.role === "waiter" || s.role === "manager");

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
            {order?.reference} · {order?.customerName}
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

          {action === "reassign" && (
            <div className="space-y-2">
              <Label htmlFor="staff">Assign to</Label>
              <select
                id="staff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
              >
                <option value="">Select staff…</option>
                {waiters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
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
