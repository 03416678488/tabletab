"use client";

import type { HeatmapRow } from "@/lib/types";
import { HEATMAP_HOURS } from "@/lib/mock/analytics";
import { cn } from "@/lib/utils";

interface PeakHoursHeatmapProps {
  data: HeatmapRow[];
}

/** Day × hour grid, cell shade ∝ order volume. Pure CSS — no chart library. */
export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  const max = Math.max(1, ...data.flatMap((r) => r.hours));

  // Teal ramp keyed to intensity (0–1).
  const shade = (v: number) => {
    if (v === 0) return "bg-subtle";
    const t = v / max;
    if (t < 0.2) return "bg-brand/10";
    if (t < 0.4) return "bg-brand/25";
    if (t < 0.6) return "bg-brand/45";
    if (t < 0.8) return "bg-brand/70";
    return "bg-brand";
  };
  const textColor = (v: number) => (v / max >= 0.6 ? "text-white" : "text-muted-foreground");

  const fmtHour = (h: number) => (h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Hour header */}
        <div
          className="grid items-center gap-1 pb-1"
          style={{ gridTemplateColumns: `2.5rem repeat(${HEATMAP_HOURS.length}, minmax(0, 1fr))` }}
        >
          <span />
          {HEATMAP_HOURS.map((h) => (
            <span key={h} className="text-center text-[10px] font-medium text-muted-foreground">
              {fmtHour(h)}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {data.map((row) => (
            <div
              key={row.day}
              className="grid items-center gap-1"
              style={{ gridTemplateColumns: `2.5rem repeat(${HEATMAP_HOURS.length}, minmax(0, 1fr))` }}
            >
              <span className="text-xs font-medium text-muted-foreground">{row.day}</span>
              {row.hours.map((v, i) => (
                <div
                  key={i}
                  title={`${row.day} ${fmtHour(HEATMAP_HOURS[i])} · ${v} orders`}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md text-[9px] font-semibold tabular-nums transition-colors",
                    shade(v),
                    textColor(v),
                  )}
                >
                  {v >= max * 0.6 ? v : ""}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <span>Fewer</span>
          <div className="flex gap-0.5">
            {["bg-brand/10", "bg-brand/25", "bg-brand/45", "bg-brand/70", "bg-brand"].map((c) => (
              <span key={c} className={cn("size-3 rounded-sm", c)} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
