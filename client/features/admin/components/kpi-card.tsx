import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/features/admin/components/sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: number;
  accent?: "brand" | "accent" | "neutral";
  /** Optional mini trend series rendered under the value. */
  spark?: number[];
  /** When true, a negative trend is good (e.g. response time going down). */
  lowerIsBetter?: boolean;
  /** Denser padding + smaller value for dashboard grids. */
  compact?: boolean;
}

const SPARK_COLOR: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  brand: "#0f766e",
  accent: "#f59e0b",
  neutral: "#475569",
};

export function KpiCard({
  label,
  value,
  sublabel,
  trend,
  accent = "brand",
  spark,
  lowerIsBetter = false,
  compact = false,
}: KpiCardProps) {
  const numericUp = trend !== undefined && trend >= 0;
  // "Good" = up, unless lowerIsBetter flips it (a drop in response time is good).
  const good = trend === undefined ? true : lowerIsBetter ? !numericUp : numericUp;

  const accentStyles = {
    brand: "from-brand/15 to-brand-tint border-brand/20",
    accent: "from-amber-100/80 to-accent-tint border-amber-200/60",
    neutral: "from-slate-100 to-subtle border-border",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[var(--shadow-card)]",
        compact ? "p-4" : "p-5",
        accentStyles[accent],
      )}
    >
      <div className="min-w-0">
        <p className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {label}
        </p>
        <p
          className={cn(
            "mt-1 font-display font-bold tracking-tight text-ink",
            compact ? "text-2xl" : "text-3xl",
          )}
        >
          {value}
        </p>
        {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
      </div>

      {spark && spark.length > 1 && (
        <div className={cn("-mx-1", compact ? "mt-2" : "mt-3")}>
          <Sparkline data={spark} color={SPARK_COLOR[accent]} />
        </div>
      )}

      {trend !== undefined && (
        <p
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            compact ? "mt-1.5" : "mt-2",
            good ? "text-emerald-700" : "text-red-600",
          )}
        >
          {numericUp ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {numericUp ? "+" : ""}
          {trend}% vs last period
        </p>
      )}
    </div>
  );
}
