"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** A concrete date range (local YYYY-MM-DD) plus a human label. */
export interface DateRange {
  from: string;
  to: string;
  label: string;
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const shift = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

/** The built-in quick presets, each resolving to a concrete range. */
export const DATE_PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Today", range: () => ({ from: ymd(new Date()), to: ymd(new Date()), label: "Today" }) },
  {
    label: "Last 7 days",
    range: () => ({ from: ymd(shift(6)), to: ymd(new Date()), label: "Last 7 days" }),
  },
  {
    label: "Last 30 days",
    range: () => ({ from: ymd(shift(29)), to: ymd(new Date()), label: "Last 30 days" }),
  },
  {
    label: "This month",
    range: () => {
      const now = new Date();
      return {
        from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: ymd(now),
        label: "This month",
      };
    },
  },
  {
    label: "This year",
    range: () => {
      const now = new Date();
      return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: ymd(now), label: "This year" };
    },
  },
];

/** Default range for a fresh filter (Last 7 days). */
export function defaultDateRange(): DateRange {
  return DATE_PRESETS[1].range();
}

/**
 * Reusable date-range filter: a compact dropdown of quick presets plus a custom
 * from/to picker. Emits a concrete `{ from, to, label }` range. Drop it into any
 * screen that filters by date (dashboard, reports, transactions…).
 */
export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the custom inputs in sync when the value changes from outside.
  useEffect(() => {
    setCustomFrom(value.from);
    setCustomTo(value.to);
  }, [value.from, value.to]);

  // Anchor the portalled panel under the button, and keep it aligned on
  // scroll/resize. Position is fixed-viewport so no ancestor overflow clips it.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // Close on outside click (button or panel excluded) and on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (range: DateRange) => {
    onChange(range);
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const [from, to] = customFrom <= customTo ? [customFrom, customTo] : [customTo, customFrom];
    pick({ from, to, label: `${from} → ${to}` });
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-white px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:border-brand/50 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="truncate">{value.label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-[100] w-64 rounded-xl border border-border bg-white p-2 text-ink shadow-[var(--shadow-elevated)]"
          >
            <div className="flex flex-col">
              {DATE_PRESETS.map((p) => {
                const r = p.range();
                const active = value.label === p.label;
                return (
                  <button
                    key={p.label}
                    type="button"
                    role="menuitem"
                    onClick={() => pick(r)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                      active ? "font-semibold text-brand-deep" : "text-ink",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 border-t border-border pt-2">
              <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Custom range
              </p>
              <div className="flex flex-col gap-2 px-1">
                <label className="flex items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
                  From
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || undefined}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-white px-2 text-sm text-ink outline-none focus-visible:border-brand"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
                  To
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom || undefined}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-white px-2 text-sm text-ink outline-none focus-visible:border-brand"
                  />
                </label>
                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo}
                  className="mt-1 h-8 rounded-lg bg-brand text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
