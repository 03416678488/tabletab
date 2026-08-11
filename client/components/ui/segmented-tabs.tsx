"use client";

import type { LucideIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
 * brand-colored card. Built on shadcn `Tabs` (Radix — arrow-key nav + a11y),
 * restyled to the segmented look. Content is rendered by the caller off `value`.
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
    <Tabs value={value} onValueChange={onChange} className={cn("w-full", className)}>
      <TabsList
        aria-label={ariaLabel}
        className="flex h-auto w-full flex-wrap items-center gap-1 rounded-2xl bg-secondary/60 p-1"
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.key === value;
          return (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className={cn(
                "rounded-xl px-3.5 py-2 text-muted-foreground data-[state=active]:bg-brand data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                grow && "flex-1",
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
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
