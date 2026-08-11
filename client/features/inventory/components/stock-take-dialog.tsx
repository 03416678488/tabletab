"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { StockTake } from "@/features/inventory/types/inventory.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the freshly-created take so the parent can open the counter. */
  onCreated: (take: StockTake) => void;
}

export function StockTakeDialog({ open, onOpenChange, onCreated }: Props) {
  const { branches } = useBranches();
  const [branchId, setBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBranchId(branches[0]?.id ?? "");
    setNotes("");
  }, [open, branches]);

  const submit = async () => {
    if (!branchId) {
      toast("Pick a branch", { tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const take = await inventoryService.createStockTake({
        branchId,
        notes: notes.trim() || undefined,
      });
      toast(`${take.reference} opened — enter your counts`, { tone: "success" });
      onCreated(take);
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't start count", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New stock count</DialogTitle>
          <DialogDescription>
            Snapshots every active item&apos;s on-hand at the branch so you can count against it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Branch</Label>
            <Dropdown
              value={branchId}
              onChange={setBranchId}
              placeholder="Select branch"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="take-notes">Notes (optional)</Label>
            <Input id="take-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Start count
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
