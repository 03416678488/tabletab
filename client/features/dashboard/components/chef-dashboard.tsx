"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChefHat, Clock, Flame, MonitorPlay, Soup, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useOrderBoard } from "@/features/order/hooks/use-order-board";
import { StatTile } from "@/features/dashboard/components/stat-tile";

function minsAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function ChefDashboard() {
  const role = useParams<{ role: string }>().role;
  const { orders, connected } = useOrderBoard();

  const stats = useMemo(() => {
    const incoming = orders.filter((o) => o.status === "placed" || o.status === "confirmed");
    const preparing = orders.filter((o) => o.status === "preparing");
    const ready = orders.filter((o) => o.status === "ready");
    const oldest = orders.reduce<number>((max, o) => Math.max(max, minsAgo(o.createdAt)), 0);
    return { incoming, preparing, ready, oldest };
  }, [orders]);

  // Oldest still-cooking tickets to nudge the line.
  const oldestTickets = useMemo(
    () =>
      [...orders]
        .filter((o) => o.status !== "ready")
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
        .slice(0, 5),
    [orders],
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <ChefHat className="size-5 text-brand" /> Kitchen overview
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {orders.length} active ticket{orders.length === 1 ? "" : "s"} ·
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                connected ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40",
              )}
            />
            {connected ? "Live" : "Reconnecting…"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${role}/kds`}>
            <MonitorPlay className="size-4" /> Open Kitchen Display
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Soup} label="New orders" value={stats.incoming.length} tone="amber" />
        <StatTile icon={Flame} label="Preparing" value={stats.preparing.length} tone="purple" />
        <StatTile icon={UtensilsCrossed} label="Ready to serve" value={stats.ready.length} tone="green" />
        <StatTile
          icon={Clock}
          label="Oldest ticket"
          value={`${stats.oldest}m`}
          tone={stats.oldest >= 15 ? "amber" : "brand"}
          hint={stats.oldest >= 15 ? "Running late" : "On track"}
        />
      </div>

      <div>
        <h2 className="mb-3 font-display font-semibold text-ink">Oldest open tickets</h2>
        {oldestTickets.length === 0 ? (
          <Card className="p-8">
            <EmptyState icon={ChefHat} title="Kitchen is clear" description="No tickets cooking right now." />
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {oldestTickets.map((o) => {
              const age = minsAgo(o.createdAt);
              return (
                <div key={o.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {o.orderNumber}
                      {o.table ? ` · ${o.table.name}` : ""}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} items · {o.status}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      age >= 15 ? "bg-accent-tint text-amber-700" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {age}m
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
