"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BranchInput } from "@/hooks/use-settings-store";
import type { Branch, FloorPlanInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyFloor = (): FloorPlanInput => ({
  floorName: "",
  tableCount: 4,
  seatsPerTable: 4,
});

const defaultInput = (): BranchInput => ({
  name: "",
  address: "",
  city: "Portland",
  phone: "",
  imageUrl: "",
  isOpen: true,
  openingHours: "Mon–Sun 11:00 – 22:00",
  deliveryZone: "5 km radius",
  deliveryFee: 4.5,
  minOrder: 15,
  onlineOrderingEnabled: true,
  floorPlans: [emptyFloor()],
});

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSave: (input: BranchInput) => void;
}

export function BranchDialog({ open, onOpenChange, branch, onSave }: BranchDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<BranchInput>(defaultInput());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setErrors({});
    if (branch) {
      setForm({
        name: branch.name,
        address: branch.address,
        city: branch.city,
        phone: branch.phone,
        imageUrl: branch.imageUrl,
        isOpen: branch.isOpen,
        openingHours: branch.openingHours ?? "Mon–Sun 11:00 – 22:00",
        deliveryZone: branch.deliveryZone ?? "5 km radius",
        deliveryFee: branch.deliveryFee ?? 4.5,
        minOrder: branch.minOrder ?? 15,
        onlineOrderingEnabled: branch.onlineOrderingEnabled ?? true,
        floorPlans: [],
      });
    } else {
      setForm(defaultInput());
    }
  }, [open, branch]);

  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const updateFloor = (idx: number, patch: Partial<FloorPlanInput>) => {
    const plans = [...(form.floorPlans ?? [])];
    plans[idx] = { ...plans[idx], ...patch };
    setForm({ ...form, floorPlans: plans });
  };

  const addFloor = () => {
    setForm({ ...form, floorPlans: [...(form.floorPlans ?? []), emptyFloor()] });
  };

  const removeFloor = (idx: number) => {
    const plans = (form.floorPlans ?? []).filter((_, i) => i !== idx);
    setForm({ ...form, floorPlans: plans.length ? plans : [emptyFloor()] });
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleSave = () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    const plans = (form.floorPlans ?? []).filter(
      (p) => p.floorName.trim() && p.tableCount > 0,
    );
    onSave({ ...form, floorPlans: plans.length ? plans : undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{branch ? "Edit branch" : "Add branch"}</DialogTitle>
          <DialogDescription>
            Step {step} of 2 — {step === 1 ? "Branch details" : "Tables & floors"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full",
                step >= s ? "bg-brand" : "bg-border",
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="br-name">Branch name</Label>
              <Input
                id="br-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="br-addr">Address</Label>
                <Input
                  id="br-addr"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="br-city">City</Label>
                <Input
                  id="br-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-hours">Opening hours</Label>
              <Input
                id="br-hours"
                value={form.openingHours}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="br-zone">Delivery zone</Label>
                <Input
                  id="br-zone"
                  value={form.deliveryZone}
                  onChange={(e) => setForm({ ...form, deliveryZone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="br-phone">Phone</Label>
                <Input
                  id="br-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="br-fee">Delivery fee ($)</Label>
                <Input
                  id="br-fee"
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.deliveryFee}
                  onChange={(e) =>
                    setForm({ ...form, deliveryFee: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="br-min">Min order ($)</Label>
                <Input
                  id="br-min"
                  type="number"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) =>
                    setForm({ ...form, minOrder: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm font-medium">Online ordering enabled</span>
              <input
                type="checkbox"
                checked={form.onlineOrderingEnabled}
                onChange={(e) =>
                  setForm({ ...form, onlineOrderingEnabled: e.target.checked })
                }
                className="size-4 accent-brand"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {branch
                ? "Add new tables by floor. Existing tables keep their QR tokens."
                : "Define floors and table counts. Labels auto-generate (e.g. G1, G2 for Ground)."}
            </p>
            {(form.floorPlans ?? []).map((plan, idx) => (
              <div key={idx} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Floor {idx + 1}</p>
                  {(form.floorPlans?.length ?? 0) > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFloor(idx)}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Floor name</Label>
                  <Input
                    placeholder="Ground, Terrace, First…"
                    value={plan.floorName}
                    onChange={(e) => updateFloor(idx, { floorName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Number of tables</Label>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={plan.tableCount}
                      onChange={(e) =>
                        updateFloor(idx, { tableCount: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seats per table (opt.)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={plan.seatsPerTable ?? ""}
                      onChange={(e) =>
                        updateFloor(idx, {
                          seatsPerTable: parseInt(e.target.value, 10) || undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addFloor}>
              Add another floor
            </Button>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button type="button" onClick={handleNext}>
              Next: Tables & floors
            </Button>
          ) : (
            <Button type="button" onClick={handleSave}>
              {branch ? "Save branch" : "Create branch"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
