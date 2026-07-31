"use client";

import { useTicker } from "@/hooks/use-ticker";
import { formatElapsed } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ElapsedTimerProps {
  since: string;
  className?: string;
  /** Highlight when SLA threshold exceeded. */
  slaBreached?: boolean;
}

export function ElapsedTimer({ since, className, slaBreached }: ElapsedTimerProps) {
  const now = useTicker();
  return (
    <span
      className={cn(
        "font-mono text-sm tabular-nums",
        slaBreached ? "text-red-400" : "text-slate-300",
        className,
      )}
    >
      {formatElapsed(since, now)}
    </span>
  );
}
