"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
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
import { ApiError, applyApiErrorToForm } from "@/lib/httpClient";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { useAreas } from "@/features/area/hooks/use-areas";
import { tableSchema, type TableFormValues } from "@/features/table/schemas/table.schema";
import { tableService } from "@/features/table/services/table.service";
import type { CreateTableInput, DiningTable } from "@/features/table/types/table.types";

interface TableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: DiningTable | null;
  /** Branch a new table defaults to (from the topbar switcher). */
  defaultBranchId?: string;
  onSaved: () => void;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function toDefaults(table: DiningTable | null, defaultBranchId?: string): TableFormValues {
  return {
    name: table?.name ?? "",
    areaId: table?.areaId ?? "",
    capacity: table?.capacity ?? 2,
    branchId: table?.branchId ?? defaultBranchId ?? "",
    isActive: table?.isActive ?? true,
  };
}

export function TableFormDialog({
  open,
  onOpenChange,
  table,
  defaultBranchId,
  onSaved,
}: TableFormDialogProps) {
  const isEdit = !!table;
  const { branches } = useBranches();

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: toDefaults(table, defaultBranchId),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  // Areas are per-branch — only offer areas belonging to the chosen branch.
  const selectedBranchId = watch("branchId");
  const { areas } = useAreas(selectedBranchId || undefined);

  useEffect(() => {
    if (open) reset(toDefaults(table, defaultBranchId));
  }, [open, table, defaultBranchId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateTableInput = {
      name: values.name,
      capacity: values.capacity,
      isActive: values.isActive,
      ...(values.areaId ? { areaId: values.areaId } : {}),
      ...(values.branchId ? { branchId: values.branchId } : {}),
    };

    try {
      if (isEdit) {
        await tableService.update(table!.id, payload);
      } else {
        await tableService.create(payload);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "name", ["name", "branchId"]);
      if (!(err instanceof ApiError)) {
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit table" : "Add table"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this table's details." : "Add a new dining table."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register("name")} aria-invalid={!!errors.name} placeholder="T1" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Seats</Label>
              <Input
                type="number"
                min={1}
                {...register("capacity", { setValueAs: toNumber })}
                aria-invalid={!!errors.capacity}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Area</Label>
            <Dropdown
              value={watch("areaId") ?? ""}
              onChange={(v) => setValue("areaId", v, { shouldDirty: true })}
              searchable
              placeholder="— No area —"
              aria-label="Area"
              options={[
                { value: "", label: "— No area —" },
                ...areas.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Branch</Label>
            <Dropdown
              value={watch("branchId") ?? ""}
              onChange={(v) => {
                setValue("branchId", v, { shouldDirty: true });
                // A branch's areas are its own — drop any area from another branch.
                setValue("areaId", "", { shouldDirty: true });
              }}
              searchable
              placeholder="— No branch —"
              aria-label="Branch"
              options={[
                { value: "", label: "— No branch —" },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-brand"
              {...register("isActive")}
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
