"use client";

import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import {
  Field,
  ImageField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/features/website-builder/components/form-fields";
import { useLiveForm } from "@/features/website-builder/hooks/use-live-form";
import {
  type FooterConfig,
  type HeaderConfig,
  footerConfigSchema,
  headerConfigSchema,
} from "@/features/website-builder/schemas/blocks";

const rowBox = "space-y-2 rounded-xl border border-border bg-subtle/50 p-3";

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

export function HeaderConfigForm({
  config,
  onChange,
}: {
  config: HeaderConfig;
  onChange: (c: HeaderConfig) => void;
}) {
  const { register, control } = useLiveForm(headerConfigSchema, config, (v) =>
    onChange(v as HeaderConfig),
  );
  const { fields, append, remove } = useFieldArray({ control, name: "links" });
  // Empty brand name falls back to the Business Info name — show it as the hint.
  const businessName = useSettings().get("company", "name");
  return (
    <div className="space-y-3">
      <TextField
        register={register}
        name="brandName"
        label="Brand name"
        placeholder={businessName ? `Defaults to “${businessName}”` : "Defaults to your business name"}
      />
      <div className="grid grid-cols-2 gap-2">
        <TextField register={register} name="ctaLabel" label="Button label" />
        <TextField register={register} name="ctaHref" label="Button link" />
      </div>
      <div className="rounded-xl border border-border p-3">
        <ToggleField control={control} name="showSearch" label="Show search" />
        <ToggleField control={control} name="showLocation" label="Show location" />
      </div>
      <Field label="Navigation links">
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className={rowBox}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Link {i + 1}</span>
                <RemoveButton onClick={() => remove(i)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField register={register} name={`links.${i}.label`} placeholder="Label" />
                <TextField register={register} name={`links.${i}.href`} placeholder="/path" />
              </div>
            </div>
          ))}
        </div>
      </Field>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ label: "Link", href: "/" })}
        className="w-full"
      >
        <Plus className="size-4" /> Add link
      </Button>
    </div>
  );
}

export function FooterConfigForm({
  config,
  onChange,
}: {
  config: FooterConfig;
  onChange: (c: FooterConfig) => void;
}) {
  const { register, control } = useLiveForm(footerConfigSchema, config, (v) =>
    onChange(v as FooterConfig),
  );
  const columns = useFieldArray({ control, name: "columns" });
  const socials = useFieldArray({ control, name: "socials" });
  return (
    <div className="space-y-3">
      <ImageField control={control} name="logoUrl" label="Footer logo" />
      <TextAreaField register={register} name="about" label="About text" rows={3} />
      <TextField register={register} name="copyright" label="Copyright line" />

      <Field label="Link columns">
        <div className="space-y-2">
          {columns.fields.map((f, i) => (
            <div key={f.id} className={rowBox}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Column {i + 1}</span>
                <RemoveButton onClick={() => columns.remove(i)} />
              </div>
              <TextField register={register} name={`columns.${i}.heading`} placeholder="Heading" />
              <NestedColumnLinks control={control} register={register} index={i} />
            </div>
          ))}
        </div>
      </Field>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => columns.append({ heading: "Column", links: [] })}
        className="w-full"
      >
        <Plus className="size-4" /> Add column
      </Button>

      <Field label="Social links">
        <div className="space-y-2">
          {socials.fields.map((f, i) => (
            <div key={f.id} className={rowBox}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Social {i + 1}</span>
                <RemoveButton onClick={() => socials.remove(i)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField register={register} name={`socials.${i}.platform`} placeholder="Platform" />
                <TextField register={register} name={`socials.${i}.href`} placeholder="URL" />
              </div>
            </div>
          ))}
        </div>
      </Field>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => socials.append({ platform: "Instagram", href: "https://" })}
        className="w-full"
      >
        <Plus className="size-4" /> Add social
      </Button>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function NestedColumnLinks({
  control,
  register,
  index,
}: {
  control: any;
  register: any;
  index: number;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: `columns.${index}.links` });
  return (
    <div className="space-y-1.5">
      {fields.map((f: { id: string }, j: number) => (
        <div key={f.id} className="flex items-center gap-1.5">
          <input
            {...register(`columns.${index}.links.${j}.label`)}
            placeholder="Label"
            className="h-8 w-full rounded-lg border border-input px-2 text-sm outline-none focus-visible:border-brand"
          />
          <input
            {...register(`columns.${index}.links.${j}.href`)}
            placeholder="/path"
            className="h-8 w-full rounded-lg border border-input px-2 text-sm outline-none focus-visible:border-brand"
          />
          <RemoveButton onClick={() => remove(j)} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ label: "Link", href: "/" })}
        className="text-xs font-medium text-brand hover:underline"
      >
        + Add link
      </button>
    </div>
  );
}
