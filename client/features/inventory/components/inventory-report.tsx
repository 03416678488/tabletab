"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, PackageX, TrendingDown, Truck, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DateRangeFilter,
  defaultDateRange,
  type DateRange,
} from "@/components/ui/date-range-filter";
import { ApiError } from "@/lib/httpClient";
import { formatMoney } from "@/lib/currency";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { InventoryReport } from "@/features/inventory/types/inventory.types";

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "ink",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  sub?: string;
  tone?: "ink" | "amber" | "red" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "green"
          ? "text-emerald-600"
          : "text-ink";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export function InventoryReport() {
  const { branches } = useBranches();
  const [branchId, setBranchId] = useState("");
  const [range, setRange] = useState<DateRange>(defaultDateRange());
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    inventoryService
      .report({
        ...(branchId ? { branchId } : {}),
        from: range.from,
        to: `${range.to}T23:59:59`,
      })
      .then((r) => !cancelled && setReport(r))
      .catch(
        (err) =>
          !cancelled && setError(err instanceof ApiError ? err.message : "Failed to load report"),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [branchId, range.from, range.to]);

  return (
    <div className="w-full">
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Dropdown
          className="w-44"
          value={branchId}
          onChange={setBranchId}
          placeholder="All branches"
          options={[
            { value: "", label: "All branches" },
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
        />
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error || !report ? (
        <Card className="mt-4">
          <EmptyState
            className="py-12"
            icon={Wallet}
            title="Couldn't load"
            description={error ?? ""}
          />
        </Card>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              icon={Wallet}
              label="Stock value"
              value={formatMoney(report.stockValue)}
              sub={`${report.itemCount} item${report.itemCount === 1 ? "" : "s"} on hand`}
            />
            <Kpi
              icon={AlertTriangle}
              label="Low / out"
              value={String(report.lowStockCount)}
              sub="at or below reorder"
              tone={report.lowStockCount > 0 ? "amber" : "ink"}
            />
            <Kpi
              icon={TrendingDown}
              label="Consumption (COGS)"
              value={formatMoney(report.period.consumptionValue)}
              sub="ingredients sold, period"
            />
            <Kpi
              icon={PackageX}
              label="Wastage"
              value={formatMoney(report.period.wastageValue)}
              sub="logged as waste, period"
              tone={report.period.wastageValue > 0 ? "red" : "ink"}
            />
          </div>

          <div className="mt-3">
            <Kpi
              icon={Truck}
              label="Purchases received"
              value={formatMoney(report.period.purchaseValue)}
              sub="stock received in period"
              tone="green"
            />
          </div>

          <Card className="mt-4 overflow-hidden p-0">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">
              Top consumed items
            </div>
            {report.topConsumed.length === 0 ? (
              <EmptyState
                className="py-10"
                icon={TrendingDown}
                title="No consumption yet"
                description="Confirmed orders that draw down stock will show here."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty consumed</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.topConsumed.map((row) => (
                      <TableRow key={row.stockItemId}>
                        <TableCell className="font-medium text-ink">{row.name}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.qty} {row.unit}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-ink tabular-nums">
                          {formatMoney(row.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
