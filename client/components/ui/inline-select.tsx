"use client";

import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";

export type InlineSelectOption = DropdownOption;

interface InlineSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: InlineSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Show a search box when there are many options. */
  searchable?: boolean;
  /** Menu alignment relative to the trigger (with a matching pointer triangle). */
  align?: "left" | "center" | "right";
  className?: string;
  "aria-label"?: string;
}

/**
 * Inline single-select: renders **only the selected value** + a small caret
 * (no input box), and opens the styled dropdown menu on click. Use this
 * anywhere a boxed field is too heavy — status changers in table rows, topbar
 * switchers, compact toolbars. Backed by the shared `Dropdown` (portalled menu,
 * so it is never clipped by table/card `overflow`).
 */
export function InlineSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  searchable,
  align,
  className,
  "aria-label": ariaLabel,
}: InlineSelectProps) {
  return (
    <Dropdown
      variant="bare"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      searchable={searchable}
      align={align}
      className={className}
      aria-label={ariaLabel}
    />
  );
}
