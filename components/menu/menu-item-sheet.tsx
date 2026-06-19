"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Model3dField } from "@/components/menu/model-3d-field";
import type { MenuItemInput } from "@/hooks/use-menu-store";
import type { MenuCategory, MenuItem, MenuTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL_TAGS: { value: MenuTag; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "spicy", label: "Spicy" },
  { value: "chef-special", label: "Chef's special" },
];

const emptyForm = (categoryId: string): MenuItemInput => ({
  name: "",
  description: "",
  price: 0,
  categoryId,
  tags: [],
  imageUrl: "https://picsum.photos/seed/new-item/640/480",
  model3dUrl: "",
  isAvailable: true,
});

interface MenuItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: MenuCategory[];
  item: MenuItem | null;
  defaultCategoryId?: string;
  onSave: (input: MenuItemInput) => void;
}

export function MenuItemSheet({
  open,
  onOpenChange,
  categories,
  item,
  defaultCategoryId,
  onSave,
}: MenuItemSheetProps) {
  const [form, setForm] = useState<MenuItemInput>(emptyForm(defaultCategoryId ?? categories[0]?.id ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: item.categoryId,
        tags: item.tags,
        imageUrl: item.imageUrl,
        model3dUrl: item.model3dUrl ?? "",
        isAvailable: item.isAvailable,
      });
    } else {
      setForm(emptyForm(defaultCategoryId ?? categories[0]?.id ?? ""));
    }
    setErrors({});
  }, [open, item, defaultCategoryId, categories]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.categoryId) next.categoryId = "Category is required";
    if (form.price < 0) next.price = "Price must be 0 or more";
    if (!form.imageUrl.trim()) next.imageUrl = "Image URL is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleTag = (tag: MenuTag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? "Edit item" : "Add menu item"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <textarea
              id="item-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-input px-3.5 py-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-price">Price ($)</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                step={0.5}
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                aria-invalid={!!errors.price}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-cat">Category</Label>
              <select
                id="item-cat"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleTag(t.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    form.tags.includes(t.value)
                      ? "border-brand bg-brand-tint text-brand-deep"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-img">Image URL</Label>
            <Input
              id="item-img"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              aria-invalid={!!errors.imageUrl}
            />
            {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl}</p>}
          </div>

          <Model3dField
            value={form.model3dUrl ?? ""}
            posterUrl={form.imageUrl}
            onChange={(model3dUrl) => setForm({ ...form, model3dUrl })}
          />

          <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <span className="text-sm font-medium">Available (not sold out)</span>
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              className="size-4 accent-brand"
            />
          </label>
        </div>

        <SheetFooter>
          <Button className="w-full" onClick={handleSubmit}>
            {item ? "Save changes" : "Add item"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
