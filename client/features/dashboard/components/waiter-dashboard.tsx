"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Armchair, ConciergeBell, HandCoins, ScanLine, Utensils, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { useTableStats } from "@/features/order/hooks/use-table-stats";
import { useTables } from "@/features/table/hooks/use-tables";
import { StatTile } from "@/features/dashboard/components/stat-tile";

export function WaiterDashboard() {
  const role = useParams<{ role: string }>().role;
  const { byTable } = useTableStats();
  const { tables } = useTables();

  const { occupied, served, kot, toCollect, servedTables } = useMemo(() => {
    const stats = [...byTable.values()];
    const servedStats = stats.filter((s) => s.orderStatus === "served");
    const nameFor = (id: string) => tables.find((t) => t.id === id)?.name ?? "Table";
    return {
      occupied: stats.length,
      served: servedStats.length,
      kot: stats.filter((s) => s.status === "kot").length,
      toCollect: servedStats.reduce((sum, s) => sum + s.total, 0),
      servedTables: servedStats.map((s) => ({ ...s, name: nameFor(s.tableId) })),
    };
  }, [byTable, tables]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <ConciergeBell className="size-5 text-brand" /> Floor overview
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {occupied} occupied · {served} awaiting payment
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${role}/tables`}>
              <Armchair className="size-4" /> Tables
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/${role}/pos`}>
              <ScanLine className="size-4" /> Open POS
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Armchair} label="Occupied tables" value={occupied} tone="brand" />
        <StatTile icon={HandCoins} label="Awaiting payment" value={served} tone="amber" />
        <StatTile icon={Utensils} label="Kitchen active" value={kot} tone="purple" />
        <StatTile icon={Wallet} label="To collect" value={formatCurrency(toCollect)} tone="green" />
      </div>

      <div>
        <h2 className="mb-3 font-display font-semibold text-ink">Served — ready to bill</h2>
        {servedTables.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={ConciergeBell}
              title="Nothing to bill"
              description="Served tables awaiting payment will appear here."
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {servedTables.map((s) => (
              <Card key={s.tableId} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.itemCount} item{s.itemCount === 1 ? "" : "s"} · {formatCurrency(s.total)}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/${role}/pos`}>Collect</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
