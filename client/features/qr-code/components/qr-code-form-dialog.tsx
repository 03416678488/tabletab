"use client";

import { useEffect, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ApiError, applyApiErrorToForm } from "@/lib/httpClient";

import { useTables } from "@/features/table/hooks/use-tables";
import {
  qrCodeSchema,
  type QrCodeFormValues,
} from "@/features/qr-code/schemas/qr-code.schema";
import { qrCodeService } from "@/features/qr-code/services/qr-code.service";
import type { QrCode } from "@/features/qr-code/types/qr-code.types";

interface QrCodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QrCode | null;
  /** Table ids that already have a QR code (excluded from the picker). */
  usedTableIds: string[];
  onSaved: () => void;
}

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export function QrCodeFormDialog({
  open,
  onOpenChange,
  qrCode,
  usedTableIds,
  onSaved,
}: QrCodeFormDialogProps) {
  const isEdit = !!qrCode;
  const { tables } = useTables();

  const options = useMemo(() => {
    const used = new Set(usedTableIds);
    return tables.filter(
      (t) => t.id === qrCode?.tableId || !used.has(t.id),
    );
  }, [tables, usedTableIds, qrCode]);

  const form = useForm<QrCodeFormValues>({
    resolver: zodResolver(qrCodeSchema),
    defaultValues: {
      tableId: qrCode?.tableId ?? "",
      isActive: qrCode?.isActive ?? true,
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) {
      reset({
        tableId: qrCode?.tableId ?? "",
        isActive: qrCode?.isActive ?? true,
      });
    }
  }, [open, qrCode, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await qrCodeService.update(qrCode!.id, { isActive: values.isActive });
        toast("QR code updated", { tone: "success" });
      } else {
        await qrCodeService.create({
          tableId: values.tableId,
          isActive: values.isActive,
        });
        toast("QR code created", { tone: "success" });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "tableId", ["tableId"]);
      if (!(err instanceof ApiError)) {
        toast("Something went wrong", { tone: "error" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit QR code" : "Add QR code"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Toggle whether this table's QR code is active."
              : "Generate a scannable QR code for a table."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Table</Label>
            <select
              className={SELECT_CLASS}
              disabled={isEdit}
              aria-invalid={!!errors.tableId}
              {...register("tableId")}
            >
              <option value="">— Select a table —</option>
              {options.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.area?.name ? ` · ${t.area.name}` : ""}
                </option>
              ))}
            </select>
            {errors.tableId && (
              <p className="text-xs text-destructive">{errors.tableId.message}</p>
            )}
            {!isEdit && options.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Every table already has a QR code.
              </p>
            )}
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
              {isEdit ? "Save changes" : "Create QR code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
