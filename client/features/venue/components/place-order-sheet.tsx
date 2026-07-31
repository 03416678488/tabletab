"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useVenueStore } from "@/hooks/use-venue-store";
import { formatCurrency } from "@/lib/utils";

interface PlaceOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlace: (name: string) => Promise<void>;
  placing?: boolean;
}

export function PlaceOrderSheet({
  open,
  onOpenChange,
  onPlace,
  placing,
}: PlaceOrderSheetProps) {
  const customerName = useVenueStore((s) => s.customerName);
  const setCustomerName = useVenueStore((s) => s.setCustomerName);
  const total = useVenueStore((s) => s.total());
  const tableLabel = useVenueStore((s) => s.tableLabel);
  const [name, setName] = useState(customerName);
  const [error, setError] = useState("");

  const handleOpen = (next: boolean) => {
    if (next) setName(customerName);
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setCustomerName(name);
    await onPlace(name.trim());
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Place your order</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Table {tableLabel} · {formatCurrency(total)}
          </p>
        </SheetHeader>
        <div className="space-y-4 px-6">
          <div className="space-y-2">
            <Label htmlFor="venue-name">Your name</Label>
            <Input
              id="venue-name"
              placeholder="So we can call your order"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              We&apos;ll remember this for the rest of your visit.
            </p>
          </div>
        </div>
        <SheetFooter>
          <Button className="w-full" size="lg" disabled={placing} onClick={handleSubmit}>
            {placing ? "Sending to kitchen…" : "Confirm & place order"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
