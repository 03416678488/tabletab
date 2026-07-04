import { Check, Circle } from "lucide-react";
import type { FulfillmentType, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  statuses: OrderStatus[];
}

const DELIVERY_STEPS: TimelineStep[] = [
  { id: "received", label: "Received", statuses: ["placed"] },
  { id: "accepted", label: "Accepted", statuses: ["accepted"] },
  { id: "preparing", label: "Preparing", statuses: ["preparing"] },
  { id: "ready", label: "Ready", statuses: ["ready"] },
  { id: "delivery", label: "Out for delivery", statuses: ["out-for-delivery"] },
  { id: "completed", label: "Completed", statuses: ["completed"] },
];

const PICKUP_STEPS: TimelineStep[] = [
  { id: "received", label: "Received", statuses: ["placed"] },
  { id: "accepted", label: "Accepted", statuses: ["accepted"] },
  { id: "preparing", label: "Preparing", statuses: ["preparing"] },
  { id: "ready", label: "Ready for pickup", statuses: ["ready"] },
  { id: "completed", label: "Completed", statuses: ["completed"] },
];

const STATUS_ORDER: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out-for-delivery",
  "completed",
];

function stepIndex(status: OrderStatus, fulfillment: FulfillmentType): number {
  const steps = fulfillment === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].statuses.includes(status)) return i;
  }
  const globalIdx = STATUS_ORDER.indexOf(status);
  if (globalIdx < 0) return 0;
  if (fulfillment === "pickup" && status === "out-for-delivery") return 3;
  return globalIdx;
}

interface OrderTimelineProps {
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
}

export function OrderTimeline({ status, fulfillmentType }: OrderTimelineProps) {
  const steps = fulfillmentType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const activeIdx = stepIndex(status, fulfillmentType);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        This order was cancelled.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {steps.map((step, idx) => {
        const done = idx < activeIdx;
        const current = idx === activeIdx;
        const upcoming = idx > activeIdx;

        return (
          <li key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-brand bg-brand text-primary-foreground",
                  current && "border-brand bg-brand-tint text-brand-deep",
                  upcoming && "border-border bg-surface text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-4" />
                ) : (
                  <Circle className={cn("size-3", current && "fill-brand text-brand")} />
                )}
              </span>
              {idx < steps.length - 1 && (
                <span
                  className={cn(
                    "my-1 w-0.5 flex-1 min-h-6",
                    done ? "bg-brand" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-6 pt-1", idx === steps.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "font-medium",
                  current ? "text-brand-deep" : done ? "text-ink" : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {current && status !== "completed" && (
                <p className="mt-0.5 text-sm text-muted-foreground">In progress…</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
