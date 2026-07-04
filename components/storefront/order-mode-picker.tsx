"use client";

import { CalendarDays, ShoppingBag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderMode = "delivery" | "pickup" | "reserve";

const MODES: {
  id: OrderMode;
  label: string;
  description: string;
  icon: typeof Truck;
}[] = [
  {
    id: "delivery",
    label: "Delivery",
    description: "To your door",
    icon: Truck,
  },
  {
    id: "pickup",
    label: "Pickup",
    description: "Collect in person",
    icon: ShoppingBag,
  },
  {
    id: "reserve",
    label: "Reserve a table",
    description: "Book ahead & pre-order",
    icon: CalendarDays,
  },
];

interface OrderModePickerProps {
  value: OrderMode;
  onChange: (mode: OrderMode) => void;
}

export function OrderModePicker({ value, onChange }: OrderModePickerProps) {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-3">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const selected = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
              selected
                ? "border-brand bg-brand-tint/60 shadow-[var(--shadow-card)] ring-2 ring-brand/30"
                : "border-border bg-surface hover:border-brand/40 hover:bg-subtle/50",
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                selected ? "bg-brand text-primary-foreground" : "bg-subtle text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="font-display font-semibold text-ink">{mode.label}</span>
            <span className="text-sm text-muted-foreground">{mode.description}</span>
          </button>
        );
      })}
    </div>
  );
}
