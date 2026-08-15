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
  eventTypeSchema,
  type EventTypeFormValues,
} from "@/features/event/schemas/event-type.schema";
import { eventTypeService } from "@/features/event/services/event-type.service";
import { ImagePickerField } from "@/features/media/components/image-picker-field";
import type { CreateEventTypeInput, EventType } from "@/features/event/types/event.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType: EventType | null;
  /** Branch a new event type belongs to (from the topbar switcher). */
  branchId?: string;
  onSaved: () => void;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toDefaults(eventType: EventType | null): EventTypeFormValues {
  return {
    name: eventType?.name ?? "",
    description: eventType?.description ?? "",
    imageUrl: eventType?.imageUrl ?? "",
    basePrice: eventType?.basePrice ?? "",
    sortOrder: eventType?.sortOrder ?? 0,
    isActive: eventType?.isActive ?? true,
  };
}

export function EventTypeFormDialog({ open, onOpenChange, eventType, branchId, onSaved }: Props) {
  const isEdit = !!eventType;
  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: toDefaults(eventType),
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
    if (open) reset(toDefaults(eventType));
  }, [open, eventType, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateEventTypeInput = {
      name: values.name,
      isActive: values.isActive,
      imageUrl: values.imageUrl ?? "",
      ...(values.description ? { description: values.description } : {}),
      ...(values.basePrice ? { basePrice: values.basePrice } : {}),
      ...(values.sortOrder !== undefined ? { sortOrder: values.sortOrder } : {}),
    };

    try {
      if (isEdit) {
        await eventTypeService.update(eventType!.id, payload);
        toast("Event type updated", { tone: "success" });
      } else {
        await eventTypeService.create({ ...payload, ...(branchId ? { branchId } : {}) });
        toast("Event type created", { tone: "success" });
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
          <DialogTitle>{isEdit ? "Edit event type" : "Add event type"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this event type's details."
              : "Create a bookable event type (Birthday, Wedding, …)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} aria-invalid={!!errors.name} placeholder="e.g. Birthday" />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starting price</Label>
              <Input {...register("basePrice")} placeholder="0.00" inputMode="decimal" />
              {errors.basePrice && (
                <p className="text-xs text-destructive">{errors.basePrice.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" {...register("sortOrder", { setValueAs: toOptionalNumber })} />
            </div>
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-brand"
              {...register("isActive")}
            />
            Active (bookable on the storefront)
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create event type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
