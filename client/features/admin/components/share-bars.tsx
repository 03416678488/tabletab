"use client";

const COLORS = ["#0f766e", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"];

interface ShareItem {
  label: string;
  pct: number;
  hint?: string;
}

interface ShareBarsProps {
  items: ShareItem[];
}

/** Compact labelled progress bars for share-of-total breakdowns. */
export function ShareBars({ items }: ShareBarsProps) {
  return (
    <ul className="space-y-3">
      {items.map((item, idx) => (
        <li key={item.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{item.label}</span>
            <span className="text-muted-foreground">
              {item.hint ? `${item.hint} · ` : ""}
              {item.pct}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${item.pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
