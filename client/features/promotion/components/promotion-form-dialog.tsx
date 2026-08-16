"use client";

import { useEffect, useMemo } from "react";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { useAllMenuItems } from "@/features/menu/hooks/use-all-menu-items";
import { applyApiErrorToForm } from "@/lib/httpClient";
import { ImagePickerField } from "@/features/media/components/image-picker-field";
import {
  promotionSchema,
  type PromotionFormValues,
} from "@/features/promotion/schemas/promotion.schema";
import { promotionService } from "@/features/promotion/services/promotion.service";
import type { CreatePromotionInput, Promotion } from "@/features/promotion/types/promotion.types";

interface PromotionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion | null;
  onSaved: () => void;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/** Stored ISO → the `datetime-local` input format (local time, no seconds). */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDefaults(p: Promotion | null): PromotionFormValues {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    description: p?.description ?? "",
    imageUrl: p?.imageUrl ?? "",
    discountType: p?.discountType ?? "percentage",
    discountValue: p?.discountValue ?? 0,
    code: p?.code ?? "",
    minOrderAmount: p?.minOrderAmount ?? undefined,
    maxDiscountAmount: p?.maxDiscountAmount ?? undefined,
    startsAt: toDatetimeLocal(p?.startsAt ?? null),
    endsAt: toDatetimeLocal(p?.endsAt ?? null),
    active: p?.active ?? true,
    usageLimit: p?.usageLimit ?? undefined,
    perCustomerLimit: p?.perCustomerLimit ?? undefined,
    productIds: p?.products?.map((x) => x.id) ?? [],
  };
}

export function PromotionFormDialog({
  open,
  onOpenChange,
  promotion,
  onSaved,
}: PromotionFormDialogProps) {
  const isEdit = !!promotion;
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: toDefaults(promotion),
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
    if (open) reset(toDefaults(promotion));
  }, [open, promotion, reset]);

  const discountType = watch("discountType");

  // Global item catalogue for the product picker (promotions aren't branch-scoped).
  const { data: allItems = [] } = useAllMenuItems();
  const productOptions = useMemo(
    () => allItems.map((i) => ({ value: i.id, label: i.name })),
    [allItems],
  );
  const productIds = watch("productIds") ?? [];

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreatePromotionInput = {
      title: values.title,
      discountType: values.discountType,
      discountValue: values.discountValue,
      active: values.active,
      imageUrl: values.imageUrl ?? "",
      ...(values.slug ? { slug: values.slug } : {}),
      ...(values.description ? { description: values.description } : {}),
      ...(values.code ? { code: values.code } : {}),
      ...(values.minOrderAmount !== undefined ? { minOrderAmount: values.minOrderAmount } : {}),
      ...(values.maxDiscountAmount !== undefined
        ? { maxDiscountAmount: values.maxDiscountAmount }
        : {}),
      ...(values.startsAt ? { startsAt: new Date(values.startsAt).toISOString() } : {}),
      ...(values.endsAt ? { endsAt: new Date(values.endsAt).toISOString() } : {}),
      ...(values.usageLimit !== undefined ? { usageLimit: values.usageLimit } : {}),
      ...(values.perCustomerLimit !== undefined
        ? { perCustomerLimit: values.perCustomerLimit }
        : {}),
      productIds: values.productIds,
    };

    try {
      if (isEdit) {
        await promotionService.update(promotion!.id, payload);
      } else {
        await promotionService.create(payload);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "title", ["title", "slug", "code"]);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit promotion" : "New promotion"}</DialogTitle>
          <DialogDescription>
            A promotion gets a landing page at <code>/promotion/&#123;slug&#125;</code> and can
            apply a discount at checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Basics */}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>URL slug</Label>
            <Input {...register("slug")} placeholder="Auto-generated from the title" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Shown on the promotion page" />
          </div>
          <div className="space-y-1.5">
            <Label>Image</Label>
            <ImagePickerField
              value={watch("imageUrl") ?? ""}
              onChange={(url) => setValue("imageUrl", url, { shouldDirty: true })}
            />
          </div>

          {/* Products this promotion discounts */}
          <div className="space-y-1.5">
            <Label>Products in this promotion</Label>
            <MultiSelect
              options={productOptions}
              value={productIds}
              onChange={(next) => setValue("productIds", next, { shouldDirty: true })}
              searchable
              placeholder="All items (cart-wide) — or pick products"
              aria-label="Products in this promotion"
            />
            <p className="text-xs text-muted-foreground">
              Pick one or more items to discount just those. Leave empty for a cart-wide promotion.
            </p>
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3">
            <div className="space-y-1.5">
              <Label>Discount type</Label>
              <Dropdown
                value={discountType}
                onChange={(v) =>
                  setValue("discountType", v as "percentage" | "fixed", { shouldDirty: true })
                }
                aria-label="Discount type"
                options={[
                  { value: "percentage", label: "Percentage (%)" },
                  { value: "fixed", label: "Fixed amount" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{discountType === "percentage" ? "Percent off" : "Amount off"}</Label>
              <Input
                type="number"
                step="0.01"
                {...register("discountValue", { setValueAs: toOptionalNumber })}
                aria-invalid={!!errors.discountValue}
              />
              {errors.discountValue && (
                <p className="text-xs text-destructive">{errors.discountValue.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Min. order</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                {...register("minOrderAmount", { setValueAs: toOptionalNumber })}
              />
            </div>
            {discountType === "percentage" && (
              <div className="space-y-1.5">
                <Label>Max discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="No cap"
                  {...register("maxDiscountAmount", { setValueAs: toOptionalNumber })}
                />
              </div>
            )}
          </div>

          {/* Code + limits */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Promo code</Label>
              <Input {...register("code")} placeholder="Blank = auto-applies (no code)" />
              <p className="text-[11px] text-muted-foreground">
                Stored uppercase. Leave blank to apply automatically.
              </p>
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Total uses</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                {...register("usageLimit", { setValueAs: toOptionalNumber })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Per customer</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                {...register("perCustomerLimit", { setValueAs: toOptionalNumber })}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input type="datetime-local" {...register("startsAt")} />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <Input type="datetime-local" {...register("endsAt")} />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-brand"
              {...register("active")}
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create promotion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
