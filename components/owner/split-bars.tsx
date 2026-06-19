"use client";

import type { BranchSplit, ChannelSplit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COLORS = ["#0f766e", "#f59e0b", "#6366f1", "#ec4899"];

interface SplitBarsProps {
  title: string;
  items: (ChannelSplit | BranchSplit)[];
  valueKey?: "channel" | "branch";
}

export function SplitBars({ title, items }: SplitBarsProps) {
  const max = Math.max(...items.map((i) => i.revenue), 1);

  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-4 space-y-4">
        {items.map((item, idx) => {
          const label = "label" in item ? item.label : item.name;
          const width = (item.revenue / max) * 100;
          return (
            <li key={label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{label}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(item.revenue)} · {item.pct}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle">
                <div
                  className={cn("h-full rounded-full transition-all")}
                  style={{
                    width: `${width}%`,
                    backgroundColor: COLORS[idx % COLORS.length],
                  }}
                />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.orders} orders</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
