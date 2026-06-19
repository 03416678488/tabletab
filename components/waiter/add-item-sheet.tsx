"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { MenuItem, Order, OrderItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface AddItemSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddItemSheet({ order, open, onOpenChange, onAdded }: AddItemSheetProps) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .getMenuItems()
      .then((items) => setMenu(items.filter((m) => m.isAvailable)))
      .finally(() => setLoading(false));
  }, [open]);

  const selected = menu.find((m) => m.id === selectedId);

  const handleAdd = async () => {
    if (!order || !selected) return;
    setSubmitting(true);
    try {
      const item: OrderItem = {
        menuItemId: selected.id,
        name: selected.name,
        quantity,
        unitPrice: selected.price,
        modifiers: [],
        notes: notes.trim() || undefined,
      };
      await api.addItemsToOrder(order.id, [item]);
      toast("Item added to order", { tone: "success" });
      setSelectedId(null);
      setQuantity(1);
      setNotes("");
      onOpenChange(false);
      onAdded();
    } catch {
      toast("Could not add item", { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add to {order?.reference}</SheetTitle>
          <SheetDescription>Select a menu item to add to this table&apos;s order.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 pb-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {menu.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedId === item.id
                        ? "border-brand bg-brand-tint"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Qty</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </Button>
                <span className="w-6 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </Button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions…"
                rows={2}
                className="w-full rounded-xl border border-input px-3 py-2 text-sm"
              />
            </>
          )}
        </div>

        <SheetFooter>
          <Button className="w-full" disabled={!selected || submitting} onClick={handleAdd}>
            {submitting ? "Adding…" : `Add ${selected ? selected.name : "item"}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
