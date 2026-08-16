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

import {
  categorySchema,
  type CategoryFormValues,
} from "@/features/category/schemas/category.schema";
import { categoryService } from "@/features/category/services/category.service";
import { ImagePickerField } from "@/features/media/components/image-picker-field";
import type { Category, CreateCategoryInput } from "@/features/category/types/category.types";

interface CategoryFormDialogProps {
  /** Owning branch for new records. */
  branchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSaved: () => void;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toDefaults(category: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
    imageUrl: category?.imageUrl ?? "",
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  };
}

export function CategoryFormDialog({
  branchId,
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryFormDialogProps) {
  const isEdit = !!category;
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: toDefaults(category),
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
    if (open) reset(toDefaults(category));
  }, [open, category, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateCategoryInput = {
      name: values.name,
      isActive: values.isActive,
      imageUrl: values.imageUrl ?? "",
      ...(values.description ? { description: values.description } : {}),
      ...(values.sortOrder !== undefined ? { sortOrder: values.sortOrder } : {}),
    };

    try {
      if (isEdit) {
        await categoryService.update(category!.id, payload);
      } else {
        await categoryService.create({ ...payload, ...(branchId ? { branchId } : {}) });
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
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this category's details." : "Create a new menu category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Name</Label>
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
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
