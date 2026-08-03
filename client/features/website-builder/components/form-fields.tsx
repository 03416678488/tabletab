"use client";

import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";

import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  children,
  className,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label className="text-xs">{label}</Label>}
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function TextField<T extends FieldValues>({
  register,
  name,
  label,
  placeholder,
  error,
}: {
  register: UseFormRegister<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <Input {...register(name)} placeholder={placeholder} className="h-9" />
    </Field>
  );
}

export function TextAreaField<T extends FieldValues>({
  register,
  name,
  label,
  placeholder,
  rows = 3,
  error,
}: {
  register: UseFormRegister<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  rows?: number;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <textarea
        {...register(name)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    </Field>
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
}: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  options: DropdownOption[];
}) {
  return (
    <Field label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Dropdown value={String(field.value ?? "")} onChange={field.onChange} options={options} />
        )}
      />
    </Field>
  );
}

export function ToggleField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <button
          type="button"
          onClick={() => field.onChange(!field.value)}
          className="flex w-full items-center justify-between gap-2 py-1"
        >
          <span className="text-xs font-medium text-ink">{label}</span>
          <span
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              field.value ? "bg-brand" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                field.value ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </span>
        </button>
      )}
    />
  );
}
