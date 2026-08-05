"use client";

import { useFieldArray } from "react-hook-form";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLiveForm } from "@/features/website-builder/hooks/use-live-form";
import {
  Field,
  ImageField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/features/website-builder/components/form-fields";
import { RichTextEditor } from "@/features/website-builder/components/rich-text-editor";
import { LinkField } from "@/features/website-builder/components/link-field";
import {
  bannerSliderConfigSchema,
  featuredCategoriesConfigSchema,
  heroConfigSchema,
  imageSliderConfigSchema,
  menuGridConfigSchema,
  menuSliderConfigSchema,
  productCarouselConfigSchema,
  promoConfigSchema,
  reservationConfigSchema,
  richCtaConfigSchema,
  richTextConfigSchema,
} from "@/features/website-builder/schemas/blocks";

export interface ConfigFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  /** Category options for data blocks (id → name). */
  categoryOptions?: { value: string; label: string }[];
  /** Menu options for the menu grid (id → name). */
  menuOptions?: { value: string; label: string }[];
  /** Product options for the product-cards block (id → name). */
  productOptions?: { value: string; label: string }[];
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

/**
 * A drag-sortable row for field-array editors. Only the grip handle initiates a
 * drag, so the inner inputs stay fully interactive.
 */
function SortableRow({
  id,
  title,
  onRemove,
  children,
}: {
  id: string;
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(rowBox, isDragging && "relative z-10 opacity-80 shadow-[var(--shadow-elevated)]")}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="-ml-1 cursor-grab touch-none text-muted-foreground hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="flex-1 text-xs font-semibold text-muted-foreground">{title}</span>
        <RemoveButton onClick={onRemove} />
      </div>
      {children}
    </div>
  );
}

/** A compact drag-sortable chip for id-list pickers (label + drag + remove). */
function SortableChip({
  id,
  label,
  onRemove,
}: {
  id: string;
  label: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5",
        isDragging && "relative z-10 opacity-80 shadow-[var(--shadow-elevated)]",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-muted-foreground hover:text-ink active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        className="text-muted-foreground hover:text-rose-600"
      >
        <X className="size-4" />
      </button>
    </div>
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
      <ImageField control={control} name="imageUrl" label="Background image" />
      <div className="grid grid-cols-2 gap-2">
        <TextField register={register} name="ctaLabel" label="Button label" />
        <LinkField control={control} name="ctaHref" label="Button link" />
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
  const { register, control, watch, formState } = useLiveForm(
    imageSliderConfigSchema,
    config,
    onChange,
  );
  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const autoplay = watch("autoplay");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from !== -1 && to !== -1) move(from, to);
  };
  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />
      <div className="space-y-2 rounded-xl border border-border p-3">
        <ToggleField control={control} name="autoplay" label="Auto-play slides" />
        {autoplay && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="text-xs font-medium text-ink">Seconds per slide</span>
            <Input
              type="number"
              min={1}
              max={30}
              step={1}
              {...register("autoplaySeconds")}
              className="h-9 w-20 text-center"
            />
          </div>
        )}
      </div>
      <SelectField
        control={control}
        name="perView"
        label="Slides per view"
        options={[
          { value: "1", label: "1 (one at a time)" },
          { value: "2", label: "2 side by side" },
          { value: "3", label: "3 side by side" },
          { value: "4", label: "4 side by side" },
        ]}
      />
      <ToggleField control={control} name="showArrows" label="Show navigation arrows" />
      <Field label="Slides" error={formState.errors.images?.message as string | undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <SortableRow
                  key={f.id}
                  id={f.id}
                  title={`Slide ${i + 1}`}
                  onRemove={() => remove(i)}
                >
                  <ImageField control={control} name={`images.${i}.url`} label="Image" />
                  <div className="grid grid-cols-2 gap-2">
                    <TextField register={register} name={`images.${i}.caption`} placeholder="Caption" />
                    <LinkField control={control} name={`images.${i}.href`} />
                  </div>
                  <TextField
                    register={register}
                    name={`images.${i}.badge`}
                    placeholder="Top-right badge, e.g. 10% Off"
                  />
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Field>
      <AddButton
        onClick={() => append({ url: "", caption: "", href: "", badge: "" })}
        label="Add slide"
      />
    </div>
  );
}

// ── Banner + slider ──────────────────────────────────────────────────────────
export function BannerSliderConfigForm({ config, onChange }: ConfigFormProps) {
  const { register, control, watch, formState } = useLiveForm(
    bannerSliderConfigSchema,
    config,
    onChange,
  );
  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const autoplay = watch("autoplay");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from !== -1 && to !== -1) move(from, to);
  };
  return (
    <div className="space-y-3">
      <SelectField
        control={control}
        name="bannerSide"
        label="Arrangement"
        options={[
          { value: "left", label: "Banner left · slider right" },
          { value: "right", label: "Slider left · banner right" },
        ]}
      />

      {/* Banner side */}
      <div className="space-y-2 rounded-xl border border-border p-3">
        <p className="text-xs font-semibold text-muted-foreground">Banner</p>
        <TextField register={register} name="eyebrow" label="Eyebrow" />
        <TextField
          register={register}
          name="title"
          label="Title"
          error={formState.errors.title?.message}
        />
        <TextField register={register} name="subtitle" label="Subtitle" />
        <div className="grid grid-cols-2 gap-2">
          <TextField register={register} name="ctaLabel" label="Button label" />
          <LinkField control={control} name="ctaHref" label="Button link" />
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
        <ImageField control={control} name="bannerImage" label="Background image (optional)" />
      </div>

      {/* Slider side */}
      <div className="space-y-2 rounded-xl border border-border p-3">
        <SelectField
          control={control}
          name="perView"
          label="Slides per view"
          options={[
            { value: "1", label: "1 (one at a time)" },
            { value: "2", label: "2 side by side" },
            { value: "3", label: "3 side by side" },
            { value: "4", label: "4 side by side" },
          ]}
        />
        <ToggleField control={control} name="autoplay" label="Auto-play slides" />
        {autoplay && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="text-xs font-medium text-ink">Seconds per slide</span>
            <Input
              type="number"
              min={1}
              max={30}
              step={1}
              {...register("autoplaySeconds")}
              className="h-9 w-20 text-center"
            />
          </div>
        )}
        <ToggleField control={control} name="showArrows" label="Show navigation arrows" />
      </div>

      <Field label="Slides" error={formState.errors.images?.message as string | undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <SortableRow
                  key={f.id}
                  id={f.id}
                  title={`Slide ${i + 1}`}
                  onRemove={() => remove(i)}
                >
                  <ImageField control={control} name={`images.${i}.url`} label="Image" />
                  <div className="grid grid-cols-2 gap-2">
                    <TextField register={register} name={`images.${i}.caption`} placeholder="Caption" />
                    <LinkField control={control} name={`images.${i}.href`} />
                  </div>
                  <TextField
                    register={register}
                    name={`images.${i}.badge`}
                    placeholder="Top-right badge, e.g. 10% Off"
                  />
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Field>
      <AddButton
        onClick={() => append({ url: "", caption: "", href: "", badge: "" })}
        label="Add slide"
      />
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
                <LinkField control={control} name={`banners.${i}.href`} />
              </div>
              <ImageField control={control} name={`banners.${i}.imageUrl`} label="Image" />
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

// ── Menu grid ────────────────────────────────────────────────────────────────
export function MenuGridConfigForm({ config, onChange, menuOptions }: ConfigFormProps) {
  const { register, control, watch, setValue } = useLiveForm(
    menuGridConfigSchema,
    config,
    onChange,
  );
  const ids = (watch("menuIds") ?? []) as string[];
  const opts = menuOptions ?? [];
  const labelFor = (id: string) => opts.find((o) => o.value === id)?.label ?? id;
  const available = opts.filter((o) => !ids.includes(o.value));

  const setIds = (next: string[]) => setValue("menuIds", next, { shouldDirty: true });
  const add = (id: string) => id && !ids.includes(id) && setIds([...ids, id]);
  const removeId = (id: string) => setIds(ids.filter((x) => x !== id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from !== -1 && to !== -1) setIds(arrayMove(ids, from, to));
  };

  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />

      <Field label="Menus to show (drag to reorder)">
        {ids.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Showing every active menu. Add specific menus below to limit and order them.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {ids.map((id) => (
                  <SortableChip
                    key={id}
                    id={id}
                    label={labelFor(id)}
                    onRemove={() => removeId(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Field>

      {available.length > 0 && (
        <Dropdown
          value=""
          onChange={add}
          options={available}
          placeholder={opts.length ? "Add a menu…" : "No menus found"}
          searchable={available.length > 6}
        />
      )}

      <SelectField
        control={control}
        name="layout"
        label="Layout (per menu)"
        options={[
          { value: "slider", label: "Slider" },
          { value: "grid", label: "Grid (4 per line)" },
        ]}
      />
      <TextField register={register} name="limit" label="Max dishes per menu" />
      <div className="space-y-2 rounded-xl border border-border p-3">
        <ToggleField control={control} name="showViewAll" label="Show “View all” links" />
        {watch("layout") === "slider" && (
          <ToggleField control={control} name="showArrows" label="Show navigation arrows" />
        )}
      </div>
    </div>
  );
}

// ── Menu slider (menu cards) ─────────────────────────────────────────────────
export function MenuSliderConfigForm({ config, onChange, menuOptions }: ConfigFormProps) {
  const { register, control, watch, setValue } = useLiveForm(
    menuSliderConfigSchema,
    config,
    onChange,
  );
  const ids = (watch("menuIds") ?? []) as string[];
  const opts = menuOptions ?? [];
  const labelFor = (id: string) => opts.find((o) => o.value === id)?.label ?? id;
  const available = opts.filter((o) => !ids.includes(o.value));

  const setIds = (next: string[]) => setValue("menuIds", next, { shouldDirty: true });
  const add = (id: string) => id && !ids.includes(id) && setIds([...ids, id]);
  const removeId = (id: string) => setIds(ids.filter((x) => x !== id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from !== -1 && to !== -1) setIds(arrayMove(ids, from, to));
  };

  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />

      <Field label="Menus to show (drag to reorder)">
        {ids.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Showing every active menu. Add specific menus below to limit and order them.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {ids.map((id) => (
                  <SortableChip key={id} id={id} label={labelFor(id)} onRemove={() => removeId(id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Field>

      {available.length > 0 && (
        <Dropdown
          value=""
          onChange={add}
          options={available}
          placeholder={opts.length ? "Add a menu…" : "No menus found"}
          searchable={available.length > 6}
        />
      )}

      <div className="rounded-xl border border-border p-3">
        <ToggleField control={control} name="showArrows" label="Show navigation arrows" />
      </div>
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
  const removeId = (id: string) => setIds(ids.filter((x) => x !== id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from !== -1 && to !== -1) setIds(arrayMove(ids, from, to));
  };

  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />

      <Field label="Featured categories (drag to reorder)">
        {ids.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No categories yet — add one below. Each shows its live products.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {ids.map((id) => (
                  <SortableChip
                    key={id}
                    id={id}
                    label={labelFor(id)}
                    onRemove={() => removeId(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
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
      <div className="space-y-2 rounded-xl border border-border p-3">
        <ToggleField control={control} name="showViewAll" label="Show “View all” links" />
        {watch("layout") === "slider" && (
          <ToggleField control={control} name="showArrows" label="Show navigation arrows" />
        )}
      </div>
    </div>
  );
}

// ── Product cards ────────────────────────────────────────────────────────────
export function ProductCarouselConfigForm({ config, onChange, productOptions }: ConfigFormProps) {
  const { register, control, watch, setValue } = useLiveForm(
    productCarouselConfigSchema,
    config,
    onChange,
  );
  const ids = (watch("itemIds") ?? []) as string[];
  const opts = productOptions ?? [];
  const labelFor = (id: string) => opts.find((o) => o.value === id)?.label ?? id;
  const available = opts.filter((o) => !ids.includes(o.value));

  const setIds = (next: string[]) => setValue("itemIds", next, { shouldDirty: true });
  const add = (id: string) => id && !ids.includes(id) && setIds([...ids, id]);
  const removeId = (id: string) => setIds(ids.filter((x) => x !== id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from !== -1 && to !== -1) setIds(arrayMove(ids, from, to));
  };

  return (
    <div className="space-y-3">
      <TextField register={register} name="title" label="Section title" />

      <Field label="Products to show (drag to reorder)">
        {ids.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Showing all products (up to the limit below). Add specific products to curate and order
            them.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {ids.map((id) => (
                  <SortableChip
                    key={id}
                    id={id}
                    label={labelFor(id)}
                    onRemove={() => removeId(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Field>

      {available.length > 0 && (
        <Dropdown
          value=""
          onChange={add}
          options={available}
          placeholder={opts.length ? "Add a product…" : "No products found"}
          searchable={available.length > 6}
        />
      )}

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
      {watch("layout") === "slider" && (
        <div className="rounded-xl border border-border p-3">
          <ToggleField control={control} name="showArrows" label="Show navigation arrows" />
        </div>
      )}
    </div>
  );
}

// ── Text & images (rich text) ────────────────────────────────────────────────
export function RichTextConfigForm({ config, onChange }: ConfigFormProps) {
  const { control, watch, setValue } = useLiveForm(richTextConfigSchema, config, onChange);
  const html = (watch("html") ?? "") as string;
  return (
    <div className="space-y-3">
      <Field label="Content">
        <RichTextEditor
          value={html}
          onChange={(v) => setValue("html", v, { shouldDirty: true })}
        />
      </Field>
      <SelectField
        control={control}
        name="width"
        label="Width"
        options={[
          { value: "prose", label: "Readable (narrow column)" },
          { value: "wide", label: "Wide (full content width)" },
        ]}
      />
      <SelectField
        control={control}
        name="align"
        label="Alignment"
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
        ]}
      />
    </div>
  );
}

// ── Reservation ──────────────────────────────────────────────────────────────
export function ReservationConfigForm({ config, onChange }: ConfigFormProps) {
  const { register, control } = useLiveForm(reservationConfigSchema, config, onChange);
  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-border bg-subtle/50 px-3 py-2 text-xs text-muted-foreground">
        Branches come live from your settings — only locations with reservations
        enabled appear here. Manage them in Settings → Reservations.
      </p>
      <TextField register={register} name="title" label="Title" />
      <TextAreaField register={register} name="subtitle" label="Subtitle" rows={2} />
      <TextField register={register} name="buttonLabel" label="Button label" />
      <SelectField
        control={control}
        name="tone"
        label="Colour"
        options={[
          { value: "light", label: "Light" },
          { value: "brand", label: "Brand" },
          { value: "dark", label: "Dark" },
        ]}
      />
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
        <LinkField control={control} name="ctaHref" label="Button link" />
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
