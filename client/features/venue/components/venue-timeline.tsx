import { Check, Circle } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const VENUE_STEPS: { id: string; label: string; statuses: OrderStatus[] }[] = [
  { id: "placed", label: "Placed", statuses: ["placed", "accepted"] },
  { id: "preparing", label: "Preparing", statuses: ["preparing"] },
  { id: "ready", label: "Ready", statuses: ["ready"] },
  { id: "served", label: "Served", statuses: ["served", "completed"] },
];

function stepIndex(status: OrderStatus): number {
  for (let i = 0; i < VENUE_STEPS.length; i++) {
    if (VENUE_STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

export function VenueTimeline({ status }: { status: OrderStatus }) {
  const activeIdx = stepIndex(status);

  return (
    <ol className="space-y-0">
      {VENUE_STEPS.map((step, idx) => {
        const done = idx < activeIdx;
        const current = idx === activeIdx;

        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-brand bg-brand text-primary-foreground",
                  current && "border-brand bg-brand-tint text-brand-deep",
                  !done && !current && "border-border bg-surface text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : (
                  <Circle className={cn("size-2.5", current && "fill-brand text-brand")} />
                )}
              </span>
              {idx < VENUE_STEPS.length - 1 && (
                <span className={cn("my-0.5 w-0.5 min-h-5 flex-1", done ? "bg-brand" : "bg-border")} />
              )}
            </div>
            <div className={cn("pb-5 pt-0.5", idx === VENUE_STEPS.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  current ? "text-brand-deep" : done ? "text-ink" : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
