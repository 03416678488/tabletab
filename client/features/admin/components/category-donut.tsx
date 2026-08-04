"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySplit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#0f766e", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#8b5cf6"];

interface CategoryDonutProps {
  data: CategorySplit[];
}

/** Sales mix by menu category — donut with a legend + share list. */
export function CategoryDonut({ data }: CategoryDonutProps) {
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
              formatter={(value, name) => {
                const n = typeof value === "number" ? value : Number(value ?? 0);
                return [formatCurrency(n), String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="font-display text-lg font-bold text-ink">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="flex-1 text-ink">{d.category}</span>
            <span className="tabular-nums text-muted-foreground">{d.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
