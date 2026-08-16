"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

import { Dropdown } from "@/components/ui/dropdown";
import { Field } from "@/features/website-builder/components/form-fields";
import { useActivePromotions } from "@/features/promotion/hooks/use-active-promotions";
import { fetchProductOptions } from "@/features/website-builder/services/storefront-menus";
import { fetchStorefrontCategories } from "@/features/storefront/services/storefront-catalog";
import { slugify } from "@/lib/utils";

type Opt = { value: string; label: string };
type Target = "item" | "category" | "promotion";

const TYPE_OPTS: Opt[] = [
  { value: "item", label: "Item" },
  { value: "category", label: "Category" },
  { value: "promotion", label: "Promotion" },
];

const ITEM = "/menu/item/";
const CAT = "/menu/category/";
const PROMO = "/promotion/";

/** Decode a stored href back into its target type + id/slug. */
function parseTarget(v: string): { type: Target; id: string } {
  if (v.startsWith(ITEM)) return { type: "item", id: v.slice(ITEM.length) };
  if (v.startsWith(CAT)) return { type: "category", id: v.slice(CAT.length) };
  if (v.startsWith(PROMO)) return { type: "promotion", id: v.slice(PROMO.length) };
  return { type: "item", id: "" };
}

/** Build the storefront href for a chosen target. */
function buildHref(type: Target, id: string): string {
  if (!id) return "";
  if (type === "item") return `${ITEM}${id}`;
  if (type === "category") return `${CAT}${id}`; // /menu/category/{slug} page
  return `${PROMO}${id}`;
}

/**
 * Link target picker for builder blocks. Instead of a free-text URL, the link is
 * always a specific storefront destination: a menu **Item**, a **Category**
 * (scrolls to its section), or a live **Promotion**. Data is cached (React
 * Query) so many instances on one page share a single fetch.
 */
export function LinkField<T extends FieldValues>({
  control,
  name,
  label = "Links to",
}: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
}) {
  const { promotions } = useActivePromotions();
  const { data: products = [] } = useQuery({
    queryKey: ["builder", "product-options"],
    queryFn: fetchProductOptions,
    staleTime: 5 * 60_000,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["builder", "category-options"],
    // Categories are per-branch (many "Starters"), so key the option off a
    // name-slug — the same slug the landing uses for its `#cat-{slug}` anchors.
    // Dedupe by slug so each name appears once and the link works on any branch.
    queryFn: () =>
      fetchStorefrontCategories().then((cs) => {
        const seen = new Map<string, string>();
        for (const c of cs) {
          const slug = slugify(c.name);
          if (slug && !seen.has(slug)) seen.set(slug, c.name);
        }
        return [...seen].map(([value, label]) => ({ value, label }));
      }),
    staleTime: 5 * 60_000,
  });
  const promoOpts: Opt[] = promotions.map((p) => ({ value: p.slug, label: p.title }));

  return (
    <Field label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TargetPicker
            value={(field.value as string) ?? ""}
            onChange={field.onChange}
            products={products}
            categories={categories}
            promoOpts={promoOpts}
          />
        )}
      />
    </Field>
  );
}

function TargetPicker({
  value,
  onChange,
  products,
  categories,
  promoOpts,
}: {
  value: string;
  onChange: (v: string) => void;
  products: Opt[];
  categories: Opt[];
  promoOpts: Opt[];
}) {
  const parsed = parseTarget(value);
  const [type, setType] = useState<Target>(parsed.type);
  const opts = type === "item" ? products : type === "category" ? categories : promoOpts;
  const selected = parsed.type === type ? parsed.id : "";

  return (
    <div className="space-y-1.5">
      <Dropdown
        value={type}
        onChange={(t) => {
          setType(t as Target);
          onChange(""); // clear selection when switching type
        }}
        options={TYPE_OPTS}
        aria-label="Link type"
      />
      <Dropdown
        value={selected}
        searchable
        onChange={(id) => onChange(buildHref(type, id))}
        options={opts}
        placeholder={opts.length ? "Select…" : "None available"}
        aria-label="Link target"
      />
    </div>
  );
}
