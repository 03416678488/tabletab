"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show a search box when there are many options. */
  searchable?: boolean;
  "aria-label"?: string;
}

/** Styled single-select dropdown (replaces native <select> where nicer UI is wanted). */
export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  searchable,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);

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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered =
    searchable && query
      ? options.filter((o) =>
          `${o.label} ${o.sublabel ?? ""}`.toLowerCase().includes(query.toLowerCase()),
        )
      : options;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-white px-3.5 text-sm shadow-sm outline-none transition-colors",
          "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand/50",
          open && "border-brand ring-2 ring-ring/30",
        )}
      >
        <span className={cn("truncate", selected ? "text-ink" : "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-elevated)]">
          {searchable && (
            <div className="border-b border-border p-1.5">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm outline-none focus-visible:border-brand"
              />
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No options</li>
            ) : (
              filtered.map((o) => {
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
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
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
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
