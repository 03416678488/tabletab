"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface IconSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

/**
 * A colorful icon that opens a compact dropdown on click (no visible label /
 * search). Used for the language + currency switchers.
 */
export function IconSelect({
  icon,
  value,
  options,
  onChange,
  ariaLabel,
  title,
  align = "end",
}: {
  icon: ReactNode;
  value: string;
  options: IconSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Tooltip on the trigger (e.g. the active selection). */
  title?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={title}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-9 items-center justify-center rounded-xl border border-transparent text-lg leading-none transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          open && "bg-secondary",
        )}
      >
        <span aria-hidden>{icon}</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 min-w-[190px] overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-elevated)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <ul className="max-h-72 overflow-y-auto p-1" role="listbox">
            {options.map((o) => {
              const active = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-brand-tint/60 text-brand-deep" : "hover:bg-secondary",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{o.label}</span>
                      {o.sublabel && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {o.sublabel}
                        </span>
                      )}
                    </span>
                    {active && <Check className="size-4 shrink-0 text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
