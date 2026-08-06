"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SegmentedTab {
  key: string;
  label: string;
  icon?: LucideIcon;
  /** Optional count badge shown after the label. */
  count?: number;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  value: string;
  onChange: (key: string) => void;
  /** Stretch tabs to equal widths (fills the row). */
  grow?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * App-wide segmented tab control: a grouped bar where the active tab lifts to a
 * white card. Used for area/section/provider switchers across the dashboard.
 */
export function SegmentedTabs({
  tabs,
  value,
  onChange,
  grow,
  className,
  "aria-label": ariaLabel,
}: SegmentedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1",
        className,
      )}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
              grow && "flex-1",
              active
                ? "bg-brand text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-ink",
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" />}
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-black/5 text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
