"use client";

import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolvePortalTarget } from "@/lib/portal-target";

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show a search box (auto-on when there are many options). */
  searchable?: boolean;
  "aria-label"?: string;
}

/**
 * Styled multi-select dropdown — a bordered trigger showing "N selected" that
 * opens a portaled checkbox list (toggle without closing). Mirrors `Dropdown`'s
 * positioning so it's never clipped by an ancestor's overflow.
 */
export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  searchable,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedSet = new Set(value);
  const selectedLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label);

  const reposition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    setPortalTarget(resolvePortalTarget(triggerRef.current));
    const onScrollOrResize = () => reposition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
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

  const toggle = (v: string) =>
    onChange(selectedSet.has(v) ? value.filter((x) => x !== v) : [...value, v]);

  const filtered =
    searchable && query
      ? options.filter((o) =>
          `${o.label} ${o.sublabel ?? ""}`.toLowerCase().includes(query.toLowerCase()),
        )
      : options;

  const GAP = 8;
  const posStyle: CSSProperties = {
    position: "fixed",
    top: rect ? rect.top + GAP : 0,
    left: rect?.left,
    width: rect?.width,
    pointerEvents: "auto",
  };

  const menu =
    open && rect && portalTarget
      ? createPortal(
          <div
            ref={menuRef}
            style={posStyle}
            className="z-[60]"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -5,
                left: 16,
                width: 10,
                height: 10,
                transform: "rotate(45deg)",
              }}
              className="block border-l border-t border-border bg-white"
            />
            <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-elevated)]">
              {(searchable || options.length > 8) && (
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
              <ul
                className="max-h-60 overflow-y-auto p-1"
                role="listbox"
                aria-multiselectable="true"
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">No options</li>
                ) : (
                  filtered.map((o) => {
                    const active = selectedSet.has(o.value);
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => toggle(o.value)}
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
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border",
                              active ? "border-brand bg-brand text-white" : "border-input",
                            )}
                          >
                            {active && <Check className="size-3" />}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>,
          portalTarget,
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-white px-3.5 text-sm shadow-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand/50",
          open && "border-brand ring-2 ring-ring/30",
        )}
      >
        <span
          className={cn("truncate", selectedLabels.length ? "text-ink" : "text-muted-foreground")}
        >
          {selectedLabels.length === 0
            ? placeholder
            : selectedLabels.length <= 2
              ? selectedLabels.join(", ")
              : `${selectedLabels.length} selected`}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </div>
  );
}
