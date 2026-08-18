"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";

import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { cn } from "@/lib/utils";

/**
 * Storefront currency switcher — a compact Globe dropdown. Sibling switchers
 * (e.g. Language) mirror this UI as their own header control.
 */
export function PreferencesMenu({ bare = false }: { bare?: boolean }) {
  const { currencies, get } = useSettings();
  const code = useDisplayCurrency((s) => s.code);
  const setCode = useDisplayCurrency((s) => s.setCode);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
  // Nothing to choose → no menu (keeps the header clean).
  if (active.length < 2) return null;

  const defaultCode = (get("site", "default_currency") || "USD").toUpperCase();
  const currentCode = (code ?? defaultCode).toUpperCase();
  const current = active.find((c) => c.code.toUpperCase() === currentCode) ?? active[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Currency"
        className={cn(
          "flex items-center font-medium transition-colors",
          bare
            ? cn("gap-1 text-xs", open ? "text-ink" : "text-muted-foreground hover:text-ink")
            : cn(
                "h-9 gap-1.5 rounded-xl border px-2.5 text-sm",
                open
                  ? "border-brand/40 text-ink"
                  : "border-border text-muted-foreground hover:border-brand/40 hover:text-ink",
              ),
        )}
      >
        <Globe className={bare ? "size-3.5" : "size-4"} />
        <span className={cn("tabular-nums", !bare && "hidden sm:inline")}>
          {current.code.toUpperCase()}
        </span>
        <ChevronDown
          className={cn(
            bare ? "size-3" : "size-3.5",
            "shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-elevated)]"
        >
          <p className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Currency
          </p>
          <div className="flex flex-col">
            {active.map((c) => {
              const selected = c.code.toUpperCase() === currentCode;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setCode(c.code.toUpperCase());
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-secondary",
                    selected && "bg-secondary/60",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-subtle text-xs font-semibold text-ink">
                    {c.symbol}
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-ink">
                    {c.code.toUpperCase()}
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-brand" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
