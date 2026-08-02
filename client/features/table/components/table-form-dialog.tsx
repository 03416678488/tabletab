"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ApiError, applyApiErrorToForm } from "@/lib/httpClient";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { useAreas } from "@/features/area/hooks/use-areas";
import {
  tableSchema,
  type TableFormValues,
} from "@/features/table/schemas/table.schema";
import { tableService } from "@/features/table/services/table.service";
import type {
  CreateTableInput,
  DiningTable,
} from "@/features/table/types/table.types";

interface TableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: DiningTable | null;
  onSaved: () => void;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function toDefaults(table: DiningTable | null): TableFormValues {
  return {
    name: table?.name ?? "",
    areaId: table?.areaId ?? "",
    capacity: table?.capacity ?? 2,
    branchId: table?.branchId ?? "",
    isActive: table?.isActive ?? true,
  };
}

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

export function TableFormDialog({
  open,
  onOpenChange,
  table,
  onSaved,
}: TableFormDialogProps) {
  const isEdit = !!table;
  const { branches } = useBranches();
  const { areas } = useAreas();

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: toDefaults(table),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(toDefaults(table));
  }, [open, table, reset]);

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
        toast("Table updated", { tone: "success" });
      } else {
        await tableService.create(payload);
        toast("Table created", { tone: "success" });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "name", ["name", "branchId"]);
      if (!(err instanceof ApiError)) {
        toast("Something went wrong", { tone: "error" });
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
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
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
            <select className={SELECT_CLASS} {...register("areaId")}>
              <option value="">— No area —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Branch</Label>
            <select className={SELECT_CLASS} {...register("branchId")}>
              <option value="">— No branch —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
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
