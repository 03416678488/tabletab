"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { api } from "@/lib/api";
import {
  buildBuffetSelection,
  buffetPackageAddOns,
  buffetPackageUsesTiers,
  buffetSelectionCoversValid,
  defaultTierCounts,
  isBuffetAvailableForSlot,
  isBuffetAvailable,
} from "@/lib/buffet-utils";
import type { BuffetPackage, BuffetSelection } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface BuffetPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  /** Default cover count (e.g. party size). */
  defaultCovers?: number;
  /** When booking a reservation, check availability for this slot. */
  slot?: { date: string; time: string };
  initialSelection?: BuffetSelection | null;
  onConfirm: (selection: BuffetSelection) => void;
}

export function BuffetPickerSheet({
  open,
  onOpenChange,
  branchId,
  defaultCovers = 2,
  slot,
  initialSelection,
  onConfirm,
}: BuffetPickerSheetProps) {
  const [packages, setPackages] = useState<BuffetPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [addOnCounts, setAddOnCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const at = slot ? `${slot.date}T${slot.time}:00` : undefined;
    api
      .getBuffetPackages(branchId, at)
      .then((list) => {
        const filtered = slot
          ? list.filter((p) => isBuffetAvailableForSlot(p, slot.date, slot.time))
          : list.filter((p) => isBuffetAvailable(p));
        setPackages(filtered);
        const initialPkg = initialSelection?.packageId ?? filtered[0]?.id ?? null;
        setSelectedId(initialPkg);
      })
      .finally(() => setLoading(false));
  }, [open, branchId, slot, initialSelection?.packageId]);

  const selected = packages.find((p) => p.id === selectedId);

  useEffect(() => {
    if (!selected) return;
    if (initialSelection && initialSelection.packageId === selected.id) {
      const counts: Record<string, number> = {};
      for (const t of initialSelection.tiers) {
        counts[t.tierId] = t.count;
      }
      setTierCounts(counts);
      const addons: Record<string, number> = {};
      for (const a of initialSelection.addOns) {
        addons[a.addOnId] = a.quantity;
      }
      setAddOnCounts(addons);
    } else {
      setTierCounts(defaultTierCounts(selected, defaultCovers));
      setAddOnCounts({});
    }
  }, [selected, defaultCovers, initialSelection]);

  const selection = useMemo(() => {
    if (!selected) return null;
    return buildBuffetSelection(selected, tierCounts, addOnCounts);
  }, [selected, tierCounts, addOnCounts]);

  const valid = selected && selection && buffetSelectionCoversValid(selected, selection);

  const adjustTier = (tierId: string, delta: number) => {
    setTierCounts((prev) => ({
      ...prev,
      [tierId]: Math.max(0, (prev[tierId] ?? 0) + delta),
    }));
  };

  const adjustAddOn = (addOnId: string, delta: number) => {
    setAddOnCounts((prev) => ({
      ...prev,
      [addOnId]: Math.max(0, (prev[addOnId] ?? 0) + delta),
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Add a buffet</SheetTitle>
          <SheetDescription>
            Priced per cover. À la carte extras can be added separately.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : packages.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No buffet available"
              description={
                slot
                  ? "No buffet is offered for this date and time."
                  : "No buffet is being served right now."
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedId(pkg.id)}
                    className={cn(
                      "flex w-full gap-4 rounded-2xl border p-4 text-left transition-all",
                      selectedId === pkg.id
                        ? "border-brand bg-brand-tint/50 ring-2 ring-brand/30"
                        : "border-border hover:border-brand/40",
                    )}
                  >
                    {pkg.imageUrl && (
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={pkg.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-ink">{pkg.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {pkg.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {pkg.availability.startTime}–{pkg.availability.endTime}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {selected && (
                <div className="space-y-4 rounded-2xl border border-border bg-subtle/50 p-4">
                  <p className="text-sm font-medium text-ink">Covers</p>
                  {buffetPackageUsesTiers(selected) ? (
                    selected.tiers.map((tier) => (
                      <div key={tier.id} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-ink">{tier.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(tier.price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => adjustTier(tier.id, -1)}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="w-6 text-center font-semibold">
                            {tierCounts[tier.id] ?? 0}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => adjustTier(tier.id, 1)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-ink">Guests</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(selected.pricePerPerson ?? 0)} per person
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => adjustTier("__flat", -1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-6 text-center font-semibold">
                          {tierCounts.__flat ?? 0}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => adjustTier("__flat", 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {selected.minGuests != null && (
                    <p className="text-xs text-muted-foreground">
                      Min {selected.minGuests} guests
                      {selected.maxGuests != null ? ` · Max ${selected.maxGuests}` : ""}
                    </p>
                  )}

                  {buffetPackageAddOns(selected).length > 0 && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <p className="text-sm font-medium text-ink">Add-ons</p>
                      {buffetPackageAddOns(selected).map((addOn) => (
                        <div key={addOn.id} className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">{addOn.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(addOn.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => adjustAddOn(addOn.id, -1)}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-5 text-center text-sm">
                              {addOnCounts[addOn.id] ?? 0}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => adjustAddOn(addOn.id, 1)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <SheetFooter className="sticky bottom-0 border-t border-border bg-surface">
          {selection && selection.totalCovers > 0 && (
            <div className="mb-3 flex items-center justify-between text-sm">
              <StatusPill tone="brand">{selection.totalCovers} covers</StatusPill>
              <span className="font-semibold text-ink">{formatCurrency(selection.subtotal)}</span>
            </div>
          )}
          <Button
            className="w-full"
            size="lg"
            disabled={!valid}
            onClick={() => {
              if (selection && valid) {
                onConfirm(selection);
                onOpenChange(false);
              }
            }}
          >
            {initialSelection ? "Update buffet" : "Add buffet"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
