"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import type { RevenueTarget } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface TargetGaugeProps {
  target: RevenueTarget;
  periodLabel: string;
}

/** Radial gauge showing revenue-to-date against the period's target. */
export function TargetGauge({ target, periodLabel }: TargetGaugeProps) {
  const pct = Math.min(100, Math.round((target.achieved / target.target) * 100));
  const data = [{ name: "progress", value: pct, fill: pct >= 100 ? "#16a34a" : "#0f766e" }];
  const remaining = Math.max(0, target.target - target.achieved);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={data}
            startAngle={220}
            endAngle={-40}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "#e2e8f0" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-ink">{pct}%</span>
          <span className="text-xs text-muted-foreground">of {periodLabel} target</span>
        </div>
      </div>
      <div className="mt-1 flex w-full items-center justify-between text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Achieved</p>
          <p className="font-semibold text-ink">{formatCurrency(target.achieved)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {remaining > 0 ? "To target" : "Over target"}
          </p>
          <p className="font-semibold text-ink">
            {remaining > 0 ? formatCurrency(remaining) : formatCurrency(target.achieved - target.target)}
          </p>
        </div>
      </div>
    </div>
  );
}
