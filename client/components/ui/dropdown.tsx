"use client";

import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  /** "default" = a bordered input-like box; "bare" = just the label + a small
   *  caret (no box), for topbar/inline switchers. */
  variant?: "default" | "bare";
  /** Horizontal alignment of the menu relative to the trigger. A small pointer
   *  triangle on top of the menu follows the same side. */
  align?: "left" | "center" | "right";
  "aria-label"?: string;
}

/** Styled single-select dropdown (replaces native <select> where nicer UI is wanted).
 *  The menu renders in a portal with fixed positioning so it is never clipped by
 *  an ancestor's `overflow` (tables, cards, scrollable dialogs). */
export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  searchable,
  variant = "default",
  align = "left",
  "aria-label": ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);
  const bare = variant === "bare";

  const reposition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom, left: bare ? r.left : r.left, width: r.width });
  };

  // Measure before paint when opening, and keep in sync on scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const onScrollOrResize = () => reposition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filtered =
    searchable && query
      ? options.filter((o) =>
          `${o.label} ${o.sublabel ?? ""}`.toLowerCase().includes(query.toLowerCase()),
        )
      : options;

  // Position + alignment of the portalled menu relative to the trigger.
  const GAP = 8;
  const posStyle: CSSProperties = { position: "fixed", top: rect ? rect.top + GAP : 0 };
  const triStyle: CSSProperties = {
    position: "absolute",
    top: -5,
    width: 10,
    height: 10,
    transform: "rotate(45deg)",
  };
  if (rect) {
    if (align === "right") {
      posStyle.left = rect.left + rect.width;
      posStyle.transform = "translateX(-100%)";
      triStyle.right = 16;
    } else if (align === "center") {
      posStyle.left = rect.left + rect.width / 2;
      posStyle.transform = "translateX(-50%)";
      triStyle.left = "50%";
      triStyle.marginLeft = -5;
    } else {
      posStyle.left = rect.left;
      triStyle.left = 16;
    }
    if (bare) posStyle.minWidth = "13rem";
    else posStyle.width = rect.width;
  }
  // The menu is portaled to <body>. Inside a modal Radix dialog, body has
  // `pointer-events: none`, so re-enable it here or options aren't clickable.
  posStyle.pointerEvents = "auto";

  const menu =
    open && rect
      ? createPortal(
          <div
            ref={menuRef}
            style={posStyle}
            className="z-[60]"
            // Stop the dialog's dismissable-layer from treating a click inside
            // this portaled menu as an "outside" interaction (which would close
            // the dialog); our own outside-handler uses `contains` instead.
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span
              aria-hidden
              style={triStyle}
              className="block border-l border-t border-border bg-white"
            />
            <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-elevated)]">
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative", bare ? "inline-block" : "", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 text-sm outline-none transition-colors",
          bare
            ? "rounded-lg px-2 py-1.5 font-medium text-ink hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/30"
            : "h-10 w-full justify-between rounded-xl border border-input bg-white px-3.5 shadow-sm focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30",
          disabled ? "cursor-not-allowed opacity-60" : !bare && "hover:border-brand/50",
          !bare && open && "border-brand ring-2 ring-ring/30",
        )}
      >
        <span className={cn("truncate", bare || selected ? "text-ink" : "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
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
