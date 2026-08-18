"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";

import { cn } from "@/lib/utils";

/** Sample UI-only language options — no i18n wiring yet, just the switcher. */
const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "ar", label: "العربية", short: "AR" },
];

/**
 * Storefront language switcher — a compact dropdown mirroring the currency one.
 * Sample only: selection is local UI state, no translation is wired up yet.
 */
export function LanguageMenu({ bare = false }: { bare?: boolean }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
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

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
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
        <Languages className={bare ? "size-3.5" : "size-4"} />
        <span className={cn("tabular-nums", !bare && "hidden sm:inline")}>{current.short}</span>
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
            Language
          </p>
          <div className="flex flex-col">
            {LANGUAGES.map((l) => {
              const selected = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-secondary",
                    selected && "bg-secondary/60",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-subtle text-xs font-semibold text-ink">
                    {l.short}
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-ink">{l.label}</span>
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
