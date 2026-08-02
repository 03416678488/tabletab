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
  foodTypeSchema,
  type FoodTypeFormValues,
} from "@/features/food-type/schemas/food-type.schema";
import { foodTypeService } from "@/features/food-type/services/food-type.service";
import { ImagePickerField } from "@/features/media/components/image-picker-field";
import type {
  CreateFoodTypeInput,
  FoodType,
} from "@/features/food-type/types/food-type.types";

interface FoodTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodType: FoodType | null;
  onSaved: () => void;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toDefaults(foodType: FoodType | null): FoodTypeFormValues {
  return {
    name: foodType?.name ?? "",
    description: foodType?.description ?? "",
    imageUrl: foodType?.imageUrl ?? "",
    sortOrder: foodType?.sortOrder ?? 0,
    isActive: foodType?.isActive ?? true,
  };
}

export function FoodTypeFormDialog({
  open,
  onOpenChange,
  foodType,
  onSaved,
}: FoodTypeFormDialogProps) {
  const isEdit = !!foodType;
  const form = useForm<FoodTypeFormValues>({
    resolver: zodResolver(foodTypeSchema),
    defaultValues: toDefaults(foodType),
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
    if (open) reset(toDefaults(foodType));
  }, [open, foodType, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateFoodTypeInput = {
      name: values.name,
      isActive: values.isActive,
      imageUrl: values.imageUrl ?? "",
      ...(values.description ? { description: values.description } : {}),
      ...(values.sortOrder !== undefined ? { sortOrder: values.sortOrder } : {}),
    };

    try {
      if (isEdit) {
        await foodTypeService.update(foodType!.id, payload);
        toast("Food type updated", { tone: "success" });
      } else {
        await foodTypeService.create(payload);
        toast("Food type created", { tone: "success" });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit food type" : "Add food type"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this food type's details."
              : "Create a new food type."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
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
            <Input
              type="number"
              {...register("sortOrder", { setValueAs: toOptionalNumber })}
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
              {isEdit ? "Save changes" : "Create food type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
