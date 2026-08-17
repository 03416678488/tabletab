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
import { ApiError, applyApiErrorToForm } from "@/lib/httpClient";

import { menuSchema, type MenuFormValues } from "@/features/menu-list/schemas/menu.schema";
import { menusService } from "@/features/menu-list/services/menu.service";
import { ImagePickerField } from "@/features/media/components/image-picker-field";
import type { CreateMenuInput, Menu } from "@/features/menu-list/types/menu.types";

interface MenuFormDialogProps {
  /** Owning branch for new records. */
  branchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: Menu | null;
  onSaved: () => void;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toDefaults(menu: Menu | null): MenuFormValues {
  return {
    name: menu?.name ?? "",
    description: menu?.description ?? "",
    imageUrl: menu?.imageUrl ?? "",
    sortOrder: menu?.sortOrder ?? 0,
    isActive: menu?.isActive ?? true,
  };
}

export function MenuFormDialog({
  branchId,
  open,
  onOpenChange,
  menu,
  onSaved,
}: MenuFormDialogProps) {
  const isEdit = !!menu;
  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: toDefaults(menu),
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(toDefaults(menu));
  }, [open, menu, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateMenuInput = {
      name: values.name,
      isActive: values.isActive,
      imageUrl: values.imageUrl ?? "",
      ...(values.description ? { description: values.description } : {}),
      ...(values.sortOrder !== undefined ? { sortOrder: values.sortOrder } : {}),
    };

    try {
      if (isEdit) {
        await menusService.update(menu!.id, payload);
      } else {
        await menusService.create({ ...payload, ...(branchId ? { branchId } : {}) });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "name", ["name"]);
      if (!(err instanceof ApiError)) {
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit menu" : "Add menu"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this menu's details." : "Create a new menu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label required>Name</Label>
            <Input {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Image</Label>
            <ImagePickerField
              value={watch("imageUrl") ?? ""}
              onChange={(url) => setValue("imageUrl", url, { shouldDirty: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sort order</Label>
            <Input type="number" {...register("sortOrder", { setValueAs: toOptionalNumber })} />
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
              {isEdit ? "Save changes" : "Create menu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
