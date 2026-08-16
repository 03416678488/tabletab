"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { applyApiErrorToForm } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

import { useCategories } from "@/features/category/hooks/use-categories";
import { useFoodTypes } from "@/features/food-type/hooks/use-food-types";
import { useMenus } from "@/features/menu-list/hooks/use-menus";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { ImagesField } from "@/features/media/components/images-field";
import { menuItemSchema, type MenuItemFormValues } from "@/features/menu/schemas/menu.schema";
import { menuService } from "@/features/menu/services/menu.service";
import type {
  CreateMenuItemInput,
  MenuItem,
  MenuOptionRow,
  RefName,
} from "@/features/menu/types/menu.types";

interface MenuFormDialogProps {
  /** Owning branch for new records. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  onSaved: () => void;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function toDefaults(item: MenuItem | null): MenuItemFormValues {
  return {
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item?.price ?? 0,
    images: item?.images ?? (item?.imageUrl ? [item.imageUrl] : []),
    categoryIds: item?.categories?.map((c) => c.id) ?? [],
    isAvailable: item?.isAvailable ?? true,
    foodTypeIds: item?.foodTypes?.map((f) => f.id) ?? [],
    menuIds: item?.menus?.map((m) => m.id) ?? [],
    sizes: item?.sizes ?? [],
    variants: item?.variants ?? [],
    addOns: item?.addOns ?? [],
  };
}

const cleanRows = (rows: MenuOptionRow[]): MenuOptionRow[] =>
  rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), price: toNumber(r.price) }));

export function MenuFormDialog({ open, onOpenChange, item, onSaved }: MenuFormDialogProps) {
  const isEdit = !!item;
  // The list may be filtered (by branch/category), which loads only a partial
  // `categories` relation — refetch the full item so every branch's membership
  // shows correctly when editing.
  const [fullItem, setFullItem] = useState<MenuItem | null>(null);
  useEffect(() => {
    if (!open || !item) {
      setFullItem(null);
      return;
    }
    let active = true;
    menuService
      .get(item.id)
      .then((full) => active && setFullItem(full))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, item]);
  const editItem = fullItem ?? item;

  const { categories } = useCategories();
  const { foodTypes } = useFoodTypes();
  const { menus } = useMenus();
  const { branches } = useBranches();

  // Categories are per-branch. Drive the list off the full branch list (not off
  // existing categories) so EVERY branch gets its own multi-select — including a
  // newly added branch that has no categories yet. A global item is "carried" at
  // a branch by selecting one of that branch's categories.
  const categoryGroups = useMemo(() => {
    const optionsByBranch = new Map<string, { value: string; label: string }[]>();
    const orphanOptions: { value: string; label: string }[] = [];
    for (const c of categories) {
      const opt = { value: c.id, label: c.name };
      if (c.branchId) {
        if (!optionsByBranch.has(c.branchId)) optionsByBranch.set(c.branchId, []);
        optionsByBranch.get(c.branchId)!.push(opt);
      } else {
        orphanOptions.push(opt);
      }
    }
    const groups = branches.map((b) => ({
      branchId: b.id,
      branchName: b.name,
      options: optionsByBranch.get(b.id) ?? [],
    }));
    if (orphanOptions.length) {
      groups.push({ branchId: "__none__", branchName: "No branch", options: orphanOptions });
    }
    return groups.sort((a, b) => a.branchName.localeCompare(b.branchName));
  }, [categories, branches]);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: toDefaults(item),
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const sizes = useFieldArray({ control, name: "sizes" });
  const variants = useFieldArray({ control, name: "variants" });
  const addOns = useFieldArray({ control, name: "addOns" });

  useEffect(() => {
    if (open) reset(toDefaults(editItem));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, fullItem, reset]);

  const categoryIds = watch("categoryIds");
  const foodTypeIds = watch("foodTypeIds");
  const menuIds = watch("menuIds");

  const toggle = (field: "categoryIds" | "foodTypeIds" | "menuIds", id: string) => {
    const current =
      field === "categoryIds" ? categoryIds : field === "foodTypeIds" ? foodTypeIds : menuIds;
    setValue(field, current.includes(id) ? current.filter((x) => x !== id) : [...current, id], {
      shouldDirty: true,
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateMenuItemInput = {
      name: values.name,
      price: values.price,
      isAvailable: values.isAvailable,
      images: values.images,
      categoryIds: values.categoryIds,
      foodTypeIds: values.foodTypeIds,
      menuIds: values.menuIds,
      sizes: cleanRows(values.sizes),
      variants: cleanRows(values.variants),
      addOns: cleanRows(values.addOns),
      ...(values.description ? { description: values.description } : {}),
    };

    try {
      if (isEdit) {
        await menuService.update(item!.id, payload);
      } else {
        await menuService.create(payload);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "name", ["name", "price"]);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{isEdit ? "Edit menu item" : "Add menu item"}</SheetTitle>
          <SheetDescription>Details, classification, and options for this dish.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-5 py-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-7">
              {/* Details */}
              <Section title="Details">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input {...register("name")} aria-invalid={!!errors.name} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input {...register("description")} placeholder="Optional" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Base price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("price", { setValueAs: toNumber })}
                      aria-invalid={!!errors.price}
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-brand"
                    {...register("isAvailable")}
                  />
                  Available
                </label>
              </Section>

              {/* Classification */}
              <Section title="Classification">
                <div className="space-y-2">
                  <Label>Categories (which branches carry this item)</Label>
                  {categoryGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No branches yet — add a branch first, then create categories under Menu →
                      Category.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {categoryGroups.map((g) => {
                        const groupIds = g.options.map((o) => o.value);
                        const selected = categoryIds.filter((id) => groupIds.includes(id));
                        return (
                          <div
                            key={g.branchId}
                            className="grid grid-cols-[7rem_1fr] items-center gap-2"
                          >
                            <span className="truncate text-sm font-medium text-ink">
                              {g.branchName}
                            </span>
                            {g.options.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                No categories yet for this branch
                              </span>
                            ) : (
                              <MultiSelect
                                options={g.options}
                                value={selected}
                                onChange={(next) =>
                                  setValue(
                                    "categoryIds",
                                    [
                                      ...categoryIds.filter((id) => !groupIds.includes(id)),
                                      ...next,
                                    ],
                                    { shouldDirty: true },
                                  )
                                }
                                searchable={g.options.length > 8}
                                placeholder="Not carried here"
                                aria-label={`${g.branchName} categories`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <ChipSelect
                  label="Menu"
                  options={menus}
                  value={menuIds}
                  onToggle={(id) => toggle("menuIds", id)}
                  empty="No menus yet — create one under Menu → Menu."
                />
                <ChipSelect
                  label="Food types"
                  options={foodTypes}
                  value={foodTypeIds}
                  onToggle={(id) => toggle("foodTypeIds", id)}
                  empty="No food types yet — create some under Menu → Food Types."
                />
              </Section>

              {/* Options */}
              <OptionListEditor
                title="Sizes"
                addLabel="Add size"
                namePrefix="sizes"
                fields={sizes.fields}
                append={() => sizes.append({ name: "", price: 0 })}
                remove={sizes.remove}
                register={register}
              />
              <OptionListEditor
                title="Variants"
                addLabel="Add variant"
                namePrefix="variants"
                fields={variants.fields}
                append={() => variants.append({ name: "", price: 0 })}
                remove={variants.remove}
                register={register}
              />
              <OptionListEditor
                title="Add-ons"
                addLabel="Add add-on"
                namePrefix="addOns"
                fields={addOns.fields}
                append={() => addOns.append({ name: "", price: 0 })}
                remove={addOns.remove}
                register={register}
              />
            </div>

            {/* Right column: images */}
            <div className="lg:border-l lg:border-border lg:pl-6">
              <ImagesField
                value={watch("images")}
                onChange={(urls) => setValue("images", urls, { shouldDirty: true })}
              />
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create item"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ChipSelect({
  label,
  options,
  value,
  onToggle,
  empty,
}: {
  label: string;
  options: RefName[];
  value: string[];
  onToggle: (id: string) => void;
  empty: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const active = value.includes(o.id);
            return (
              <button
                type="button"
                key={o.id}
                onClick={() => onToggle(o.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
                  active
                    ? "border-brand bg-brand-tint font-medium text-brand-deep"
                    : "border-border text-slate-600 hover:bg-secondary",
                )}
              >
                {o.name}
                {active && <X className="size-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OptionListEditor({
  title,
  addLabel,
  namePrefix,
  fields,
  append,
  remove,
  register,
}: {
  title: string;
  addLabel: string;
  namePrefix: "sizes" | "variants" | "addOns";
  fields: { id: string }[];
  append: () => void;
  remove: (index: number) => void;
  register: UseFormRegister<MenuItemFormValues>;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={append}>
          <Plus className="size-4" /> {addLabel}
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">None added.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2">
              <Input
                className="h-9 flex-1"
                placeholder="Name"
                {...register(`${namePrefix}.${i}.name` as const)}
              />
              <div className="relative w-28">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  className="h-9 pl-6"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register(`${namePrefix}.${i}.price` as const, {
                    setValueAs: (v) => {
                      const n = Number(v);
                      return Number.isNaN(n) ? 0 : n;
                    },
                  })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${title.toLowerCase()}`}
                onClick={() => remove(i)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
