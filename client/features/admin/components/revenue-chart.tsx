"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SalesPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: SalesPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px -6px rgb(15 23 42 / 0.12)",
          }}
          formatter={(value, name) => {
            const n = typeof value === "number" ? value : Number(value ?? 0);
            const key = String(name);
            return [
              key === "revenue" ? formatCurrency(n) : n,
              key === "revenue" ? "Revenue" : "Orders",
            ];
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0f766e"
          strokeWidth={2.5}
          fill="url(#revenueFill)"
          dot={{ fill: "#0f766e", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: "#0d9488" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
