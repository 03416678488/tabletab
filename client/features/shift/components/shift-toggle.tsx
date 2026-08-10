"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShift } from "@/features/shift/hooks/use-shift";

/**
 * Clock in / out control for floor & kitchen staff. On-shift staff are the only
 * ones the assignment router hands new orders / waiter-calls to, so this is how a
 * waiter/chef/rider marks themselves available.
 */
export function ShiftToggle() {
  const { onShift, loading, busy, toggle } = useShift();

  if (loading) return null;

  return (
    <Button
      variant={onShift ? "secondary" : "outline"}
      size="sm"
      onClick={() => void toggle()}
      disabled={busy}
      aria-label={onShift ? "Clock out" : "Clock in"}
      title={onShift ? "You're on shift — tap to clock out" : "Off shift — tap to clock in"}
      className={cn(
        onShift &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15",
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <span
          className={cn(
            "size-2 rounded-full",
            onShift ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
          aria-hidden
        />
      )}
      {onShift ? "On shift" : "Off shift"}
    </Button>
  );
}
