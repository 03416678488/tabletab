"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useTimeSlots } from "@/features/time-slot/hooks/use-time-slots";
import { timeSlotService } from "@/features/time-slot/services/time-slot.service";
import { WEEKDAYS } from "@/features/time-slot/types/time-slot.types";

export function TimeSlotManager() {
  const { slots, loading, error, refetch } = useTimeSlots();
  const [day, setDay] = useState<string | null>(null);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("22:00");
  const [saving, setSaving] = useState(false);

  const byDay = useMemo(() => {
    const map: Record<string, typeof slots> = {};
    for (const d of WEEKDAYS) map[d] = [];
    for (const s of slots) (map[s.day] ??= []).push(s);
    return map;
  }, [slots]);

  const add = async () => {
    if (!day) return;
    setSaving(true);
    try {
      await timeSlotService.create({ day, startTime: start, endTime: end });
      setDay(null);
      refetch();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await timeSlotService.remove(id);
      refetch();
    } catch {}
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-ink">Time Slots</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Ordering / service windows per weekday.
      </p>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">{error}</p>
        ) : (
          <ul className="divide-y divide-border">
            {WEEKDAYS.map((d) => (
              <li key={d} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="w-28 shrink-0 font-medium capitalize text-ink">{d}</span>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {byDay[d].length === 0 && (
                    <span className="text-sm text-muted-foreground">No slots</span>
                  )}
                  {byDay[d].map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-sm text-ink"
                    >
                      {s.startTime}–{s.endTime}
                      <button
                        type="button"
                        aria-label="Remove slot"
                        onClick={() => remove(s.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-brand hover:bg-brand-tint/50"
                  onClick={() => {
                    setDay(d);
                    setStart("09:00");
                    setEnd("22:00");
                  }}
                >
                  <Plus className="size-4" /> Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={!!day} onOpenChange={(o) => !o && setDay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">Add slot · {day}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDay(null)}>
              Cancel
            </Button>
            <Button disabled={saving || !start || !end} onClick={add}>
              {saving && <Loader2 className="size-4 animate-spin" />} Add slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
