"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { cn } from "@/lib/utils";

/**
 * Storefront currency picker — switches the *display* currency (prices convert
 * from the base currency; orders still charge in base). Hidden unless there are
 * at least two active currencies. Compact pill trigger + a small popover list.
 */
export function CurrencySwitcher() {
  const { currencies, get } = useSettings();
  const code = useDisplayCurrency((s) => s.code);
  const setCode = useDisplayCurrency((s) => s.setCode);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = currencies.filter((c) => c.isActive);
  if (active.length < 2) return null;

  const defaultCode = (get("site", "default_currency") || "USD").toUpperCase();
  const currentCode = (code ?? defaultCode).toUpperCase();
  const current = active.find((c) => c.code.toUpperCase() === currentCode) ?? active[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Display currency"
        className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-ink"
      >
        <span className="tabular-nums text-ink">{current.symbol}</span>
        <span>{current.code.toUpperCase()}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-[var(--shadow-elevated)]"
        >
          {active.map((c) => {
            const selected = c.code.toUpperCase() === currentCode;
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setCode(c.code.toUpperCase());
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-secondary",
                  selected && "bg-secondary/60",
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-subtle text-xs font-semibold text-ink">
                  {c.symbol}
                </span>
                <span className="min-w-0 flex-1 font-medium text-ink">{c.code.toUpperCase()}</span>
                {selected && <Check className="size-4 shrink-0 text-brand" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
