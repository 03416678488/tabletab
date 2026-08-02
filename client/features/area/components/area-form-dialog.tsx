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

import {
  areaSchema,
  type AreaFormValues,
} from "@/features/area/schemas/area.schema";
import { areaService } from "@/features/area/services/area.service";
import type { Area } from "@/features/area/types/area.types";

interface AreaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: Area | null;
  onSaved: () => void;
}

export function AreaFormDialog({
  open,
  onOpenChange,
  area,
  onSaved,
}: AreaFormDialogProps) {
  const isEdit = !!area;
  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: area?.name ?? "" },
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset({ name: area?.name ?? "" });
  }, [open, area, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await areaService.update(area!.id, values);
        toast("Area updated", { tone: "success" });
      } else {
        await areaService.create(values);
        toast("Area created", { tone: "success" });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "name", ["name"]);
      if (!(err instanceof ApiError)) {
        toast("Something went wrong", { tone: "error" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit area" : "Add area"}</DialogTitle>
          <DialogDescription>
            Areas group your tables (e.g. Patio, Main hall).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} aria-invalid={!!errors.name} autoFocus />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create area"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
