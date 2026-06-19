"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { BuffetPickerSheet } from "@/components/order/buffet-picker-sheet";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatBuffetSummary } from "@/lib/buffet-utils";
import type { BuffetSelection, Order } from "@/lib/types";

interface BuffetOrderSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function BuffetOrderSheet({ order, open, onOpenChange, onDone }: BuffetOrderSheetProps) {
  const activeBranch = useSession((s) => s.activeBranch);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in guest");
  const [submitting, setSubmitting] = useState(false);

  const isWalkIn = !order;

  useEffect(() => {
    if (open && isWalkIn && activeBranch.tables[0]) {
      setTableId(activeBranch.tables[0].id);
    }
  }, [open, isWalkIn, activeBranch.tables]);

  const handleConfirm = async (buffet: BuffetSelection) => {
    setSubmitting(true);
    try {
      if (order) {
        await api.attachBuffetToOrder(order.id, buffet);
        toast("Buffet added to order", { tone: "success" });
      } else if (tableId) {
        await api.createVenueOrder({
          branchId: activeBranch.id,
          tableId,
          customerName: customerName.trim() || "Walk-in guest",
          items: [],
          buffet,
          subtotal: buffet.subtotal,
          tax: 0,
          total: buffet.subtotal,
        });
        toast("Buffet order created", { tone: "success" });
      }
      onOpenChange(false);
      onDone();
    } catch {
      toast("Could not save buffet", { tone: "error" });
    } finally {
      setSubmitting(false);
      setPickerOpen(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>{isWalkIn ? "Walk-in buffet" : `Buffet · ${order?.reference}`}</SheetTitle>
            <SheetDescription>
              {isWalkIn
                ? "Start a covers-based buffet for a table."
                : "Attach buffet covers to this table order."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 pb-6">
            {isWalkIn && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="buffet-table">Table</Label>
                  <select
                    id="buffet-table"
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
                  >
                    {activeBranch.tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} · {t.floor}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buffet-guest">Guest name</Label>
                  <input
                    id="buffet-guest"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
                  />
                </div>
              </>
            )}

            {order?.buffet && (
              <p className="rounded-xl bg-brand-tint/40 px-4 py-3 text-sm text-brand-deep">
                Current: {formatBuffetSummary(order.buffet)}
              </p>
            )}

            <Button
              className="w-full"
              onClick={() => setPickerOpen(true)}
              disabled={submitting}
            >
              <UtensilsCrossed className="size-4" />
              {order?.buffet ? "Change buffet" : "Choose buffet package"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <BuffetPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        branchId={activeBranch.id}
        defaultCovers={order?.buffet?.totalCovers ?? 2}
        initialSelection={order?.buffet}
        onConfirm={handleConfirm}
      />
    </>
  );
}
