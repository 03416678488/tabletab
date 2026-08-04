"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyHoursEditor } from "@/components/ui/weekly-hours-editor";
import { toast } from "@/hooks/use-toast";
import { flatToWeekly, weeklyToFlat } from "@/lib/opening-hours";

import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";

/** Weekly opening hours — an open/close time per day, or mark the day closed. */
export function OpeningTimesForm() {
  const { values, set, save, loading, saving } = useSettingsGroup("opening_times");

  const week = flatToWeekly(values);

  const onWeekChange = (next: ReturnType<typeof flatToWeekly>) => {
    const flat = weeklyToFlat(next);
    for (const [k, v] of Object.entries(flat)) set(k, v);
  };

  const onSave = async () => {
    const ok = await save();
    toast(ok ? "Opening times saved" : "Save failed", { tone: ok ? "success" : "error" });
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Opening times</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Set the hours your restaurant is open each day. Toggle a day closed to hide its times.
        Branches use these by default and can override them individually.
      </p>

      <div className="mt-4">
        <WeeklyHoursEditor value={week} onChange={onWeekChange} />
      </div>

      <Button className="mt-5" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save
      </Button>
    </Card>
  );
}
