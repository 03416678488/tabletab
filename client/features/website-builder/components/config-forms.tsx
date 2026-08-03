"use client";

import { useFieldArray } from "react-hook-form";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { useLiveForm } from "@/features/website-builder/hooks/use-live-form";
import {
  Field,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/features/website-builder/components/form-fields";
import {
  categoryGridConfigSchema,
  featuredCategoriesConfigSchema,
  heroConfigSchema,
  imageSliderConfigSchema,
  productCarouselConfigSchema,
  promoConfigSchema,
  richCtaConfigSchema,
} from "@/features/website-builder/schemas/blocks";

export interface ConfigFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  /** Category options for data blocks (id → name). */
  categoryOptions?: { value: string; label: string }[];
}

const rowBox = "space-y-2 rounded-xl border border-border bg-subtle/50 p-3";

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="w-full">
      <Plus className="size-4" /> {label}
    </Button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="text-muted-foreground transition-colors hover:text-rose-600"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────
export function HeroConfigForm({ config, onChange }: ConfigFormProps) {
  const { register, control, formState } = useLiveForm(heroConfigSchema, config, onChange);
  const e = formState.errors;
  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Title" error={e.title?.message} />
      <TextField register={register} name="subtitle" label="Subtitle" />
      <TextField register={register} name="imageUrl" label="Background image URL" />
      <div className="grid grid-cols-2 gap-2">
        <TextField register={register} name="ctaLabel" label="Button label" />
        <TextField register={register} name="ctaHref" label="Button link" />
      </div>
      <SelectField
        control={control}
        name="align"
        label="Alignment"
        options={[
          { value: "center", label: "Center" },
          { value: "left", label: "Left" },
        ]}
      />
    </div>
  );
}

// ── Image slider ────────────────────────────────────────────────────────────
export function ImageSliderConfigForm({ config, onChange }: ConfigFormProps) {
  const { register, control, formState } = useLiveForm(imageSliderConfigSchema, config, onChange);
  const { fields, append, remove } = useFieldArray({ control, name: "images" });
  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />
      <ToggleField control={control} name="autoplay" label="Auto-play" />
      <Field label="Slides" error={formState.errors.images?.message as string | undefined}>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className={rowBox}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Slide {i + 1}</span>
                <RemoveButton onClick={() => remove(i)} />
              </div>
              <TextField register={register} name={`images.${i}.url`} placeholder="Image URL" />
              <div className="grid grid-cols-2 gap-2">
                <TextField register={register} name={`images.${i}.caption`} placeholder="Caption" />
                <TextField register={register} name={`images.${i}.href`} placeholder="Link" />
              </div>
            </div>
          ))}
        </div>
      </Field>
      <AddButton onClick={() => append({ url: "", caption: "", href: "" })} label="Add slide" />
    </div>
  );
}

// ── Promo banners ────────────────────────────────────────────────────────────
export function PromoConfigForm({ config, onChange }: ConfigFormProps) {
  const { register, control, formState } = useLiveForm(promoConfigSchema, config, onChange);
  const { fields, append, remove } = useFieldArray({ control, name: "banners" });
  return (
    <div className="space-y-3">
      <SelectField
        control={control}
        name="variant"
        label="Layout"
        options={[
          { value: "triple", label: "Three across" },
          { value: "double", label: "Two across" },
          { value: "full", label: "Full width" },
        ]}
      />
      <Field label="Banners" error={formState.errors.banners?.message as string | undefined}>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className={rowBox}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Banner {i + 1}</span>
                <RemoveButton onClick={() => remove(i)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField register={register} name={`banners.${i}.eyebrow`} placeholder="Eyebrow" />
                <TextField register={register} name={`banners.${i}.title`} placeholder="Title" />
              </div>
              <TextField register={register} name={`banners.${i}.subtitle`} placeholder="Subtitle" />
              <div className="grid grid-cols-2 gap-2">
                <TextField register={register} name={`banners.${i}.cta`} placeholder="Button" />
                <TextField register={register} name={`banners.${i}.href`} placeholder="Link" />
              </div>
              <TextField register={register} name={`banners.${i}.imageUrl`} placeholder="Image URL" />
            </div>
          ))}
        </div>
      </Field>
      <AddButton
        onClick={() => append({ eyebrow: "", title: "New banner", subtitle: "", cta: "", href: "", imageUrl: "" })}
        label="Add banner"
      />
    </div>
  );
}

// ── Category grid ────────────────────────────────────────────────────────────
export function CategoryGridConfigForm({ config, onChange }: ConfigFormProps) {
  const { register, control } = useLiveForm(categoryGridConfigSchema, config, onChange);
  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />
      <SelectField
        control={control}
        name="layout"
        label="Layout"
        options={[
          { value: "grid", label: "Grid (wraps to rows)" },
          { value: "slider", label: "Slider" },
        ]}
      />
      <TextField register={register} name="limit" label="Max categories" />
    </div>
  );
}

// ── Featured categories ──────────────────────────────────────────────────────
export function FeaturedCategoriesConfigForm({ config, onChange, categoryOptions }: ConfigFormProps) {
  const { register, control, watch, setValue } = useLiveForm(
    featuredCategoriesConfigSchema,
    config,
    onChange,
  );
  const ids = (watch("categoryIds") ?? []) as string[];
  const opts = categoryOptions ?? [];
  const labelFor = (id: string) => opts.find((o) => o.value === id)?.label ?? id;
  const available = opts.filter((o) => !ids.includes(o.value));

  const setIds = (next: string[]) => setValue("categoryIds", next, { shouldDirty: true });
  const add = (id: string) => id && !ids.includes(id) && setIds([...ids, id]);
  const removeAt = (i: number) => setIds(ids.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    setIds(next);
  };

  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />

      <Field label="Featured categories (in order)">
        <div className="space-y-2">
          {ids.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No categories yet — add one below. Each shows its live products.
            </p>
          )}
          {ids.map((id, i) => (
            <div
              key={id}
              className="flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {labelFor(id)}
              </span>
              <button
                type="button"
                aria-label="Move up"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-muted-foreground hover:text-ink disabled:opacity-30"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                onClick={() => move(i, 1)}
                disabled={i === ids.length - 1}
                className="text-muted-foreground hover:text-ink disabled:opacity-30"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => removeAt(i)}
                className="text-muted-foreground hover:text-rose-600"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </Field>

      {available.length > 0 && (
        <Dropdown
          value=""
          onChange={add}
          options={available}
          placeholder="Add a category…"
          searchable={available.length > 6}
        />
      )}

      <SelectField
        control={control}
        name="layout"
        label="Layout (per category)"
        options={[
          { value: "slider", label: "Slider" },
          { value: "grid", label: "Grid (4 per line)" },
        ]}
      />
      <TextField register={register} name="limit" label="Max items per category" />
      <div className="rounded-xl border border-border p-3">
        <ToggleField control={control} name="showViewAll" label="Show “View all” links" />
      </div>
    </div>
  );
}

// ── Product cards ────────────────────────────────────────────────────────────
export function ProductCarouselConfigForm({ config, onChange, categoryOptions }: ConfigFormProps) {
  const { register, control } = useLiveForm(productCarouselConfigSchema, config, onChange);
  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />
      <SelectField
        control={control}
        name="source"
        label="Show"
        options={[{ value: "popular", label: "Popular items" }, ...(categoryOptions ?? [])]}
      />
      <SelectField
        control={control}
        name="layout"
        label="Layout"
        options={[
          { value: "slider", label: "Slider" },
          { value: "grid", label: "Grid (4 per line)" },
        ]}
      />
      <TextField register={register} name="limit" label="Max items" />
    </div>
  );
}

// ── Call to action ───────────────────────────────────────────────────────────
export function RichCtaConfigForm({ config, onChange }: ConfigFormProps) {
  const { register, control, formState } = useLiveForm(richCtaConfigSchema, config, onChange);
  return (
    <div className="space-y-3">
      <TextField register={register} name="heading" label="Heading" error={formState.errors.heading?.message} />
      <TextAreaField register={register} name="text" label="Text" rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <TextField register={register} name="ctaLabel" label="Button label" />
        <TextField register={register} name="ctaHref" label="Button link" />
      </div>
      <SelectField
        control={control}
        name="tone"
        label="Colour"
        options={[
          { value: "brand", label: "Brand" },
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
        ]}
      />
    </div>
  );
}
