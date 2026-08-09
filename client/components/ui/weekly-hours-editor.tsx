"use client";

import { TimeSelect } from "@/components/ui/time-select";
import { cn } from "@/lib/utils";
import { DAYS, type DayKey, type WeeklyHours } from "@/lib/opening-hours";

interface WeeklyHoursEditorProps {
  value: WeeklyHours;
  onChange: (next: WeeklyHours) => void;
}

/** Per-day opening-hours editor: a Closed toggle + open/close time per day. */
export function WeeklyHoursEditor({ value, onChange }: WeeklyHoursEditorProps) {
  const setDay = (key: DayKey, patch: Partial<WeeklyHours[DayKey]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  return (
    <div className="space-y-2">
      {DAYS.map((d) => {
        const day = value[d.key];
        return (
          <div
            key={d.key}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-ink">{d.label}</span>

            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-brand"
                checked={day.closed}
                onChange={(e) => setDay(d.key, { closed: e.target.checked })}
              />
              Closed
            </label>

            <div
              className={cn(
                "flex items-center gap-2",
                day.closed && "pointer-events-none opacity-40",
              )}
            >
              <TimeSelect
                aria-label={`${d.label} open`}
                className="w-32"
                value={day.open}
                onChange={(v) => setDay(d.key, { open: v })}
                disabled={day.closed}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <TimeSelect
                aria-label={`${d.label} close`}
                className="w-32"
                value={day.close}
                onChange={(v) => setDay(d.key, { close: v })}
                disabled={day.closed}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
