"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SalesPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RevenueOrdersChartProps {
  data: SalesPoint[];
}

/** Revenue (area, left axis) overlaid with order count (bars, right axis). */
export function RevenueOrdersChart({ data }: RevenueOrdersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revOrdFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
        />
        <YAxis
          yAxisId="rev"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
        <YAxis
          yAxisId="ord"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(15,118,110,0.05)" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 13,
            boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
          }}
          formatter={(value, name) => {
            const n = typeof value === "number" ? value : Number(value ?? 0);
            return name === "Revenue"
              ? [formatCurrency(n), "Revenue"]
              : [n, "Orders"];
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar
          yAxisId="ord"
          dataKey="orders"
          name="Orders"
          fill="#f59e0b"
          barSize={18}
          radius={[4, 4, 0, 0]}
          opacity={0.85}
        />
        <Area
          yAxisId="rev"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#0f766e"
          strokeWidth={2.5}
          fill="url(#revOrdFill)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
