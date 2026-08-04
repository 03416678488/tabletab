"use client";

import { cn } from "@/lib/utils";
import { DAYS, type WeeklyHours } from "@/lib/opening-hours";

/** Renders each day's opening hours as its own pill/badge. */
export function WeeklyHoursBadges({
  week,
  className,
}: {
  week: WeeklyHours;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {DAYS.map((d) => {
        const s = week[d.key];
        const hasTimes = Boolean(s.open || s.close);
        return (
          <span
            key={d.key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              s.closed
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-brand/20 bg-brand-tint text-brand-deep",
            )}
          >
            <span className="font-semibold">{d.short}</span>
            <span className="opacity-80">
              {s.closed ? "Closed" : hasTimes ? `${s.open || "?"}–${s.close || "?"}` : "—"}
            </span>
          </span>
        );
      })}
    </div>
  );
}
