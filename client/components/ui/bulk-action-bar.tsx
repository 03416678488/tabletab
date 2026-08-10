"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Action bar shown above a table when one or more rows are selected. Render the
 * bulk-action controls (buttons, dropdowns) as children; the "N selected" label
 * and a clear button are provided. Renders nothing when `count` is 0.
 */
export function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand-tint/40 px-3 py-2">
      <span className="text-sm font-medium text-brand-deep">{count} selected</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <Button variant="ghost" size="icon" aria-label="Clear selection" onClick={onClear}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/** Brand-styled checkbox for table row/header selection. */
export function SelectCheckbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 accent-brand align-middle", className)}
      aria-label={label}
      checked={checked}
      onChange={onChange}
    />
  );
}
