import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/features/admin/components/sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: number;
  icon: LucideIcon;
  accent?: "brand" | "accent" | "neutral";
  /** Optional mini trend series rendered under the value. */
  spark?: number[];
  /** When true, a negative trend is good (e.g. response time going down). */
  lowerIsBetter?: boolean;
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
  icon: Icon,
  accent = "brand",
  spark,
  lowerIsBetter = false,
}: KpiCardProps) {
  const numericUp = trend !== undefined && trend >= 0;
  // "Good" = up, unless lowerIsBetter flips it (a drop in response time is good).
  const good = trend === undefined ? true : lowerIsBetter ? !numericUp : numericUp;

  const accentStyles = {
    brand: "from-brand/15 to-brand-tint border-brand/20",
    accent: "from-amber-100/80 to-accent-tint border-amber-200/60",
    neutral: "from-slate-100 to-subtle border-border",
  };
  const iconStyles = {
    brand: "bg-brand text-white",
    accent: "bg-accent text-accent-foreground",
    neutral: "bg-slate-700 text-white",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-[var(--shadow-card)]",
        accentStyles[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
        </div>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
            iconStyles[accent],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>

      {spark && spark.length > 1 && (
        <div className="mt-3 -mx-1">
          <Sparkline data={spark} color={SPARK_COLOR[accent]} />
        </div>
      )}

      {trend !== undefined && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
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
