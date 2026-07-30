"use client";

import { CalendarDays, ShoppingBag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderMode = "delivery" | "pickup" | "reserve";

const MODES: {
  id: OrderMode;
  label: string;
  icon: typeof Truck;
}[] = [
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "pickup", label: "Pickup", icon: ShoppingBag },
  { id: "reserve", label: "Reserve", icon: CalendarDays },
];

interface OrderModePickerProps {
  value: OrderMode;
  onChange: (mode: OrderMode) => void;
}

/** Compact segmented control for delivery / pickup / reserve (foodpanda-style). */
export function OrderModePicker({ value, onChange }: OrderModePickerProps) {
  return (
    <div
      role="tablist"
      aria-label="Order mode"
      className="inline-flex w-full items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-[var(--shadow-card)] sm:w-auto"
    >
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const selected = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:flex-none",
              selected
                ? "bg-brand text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
