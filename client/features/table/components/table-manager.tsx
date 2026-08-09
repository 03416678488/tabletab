"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Plus, Search, SlidersHorizontal, Table2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useTables } from "@/features/table/hooks/use-tables";
import { TableFormDialog } from "@/features/table/components/table-form-dialog";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useAreas } from "@/features/area/hooks/use-areas";
import { useTableStats } from "@/features/order/hooks/use-table-stats";
import { orderService } from "@/features/order/services/order.service";
import { ORDER_STATUS_META } from "@/features/order/constants/order.constants";
import type { TableStat } from "@/features/order/types/order.types";
import type { DiningTable } from "@/features/table/types/table.types";

const ALL = "__all__";
const NO_AREA = "__no_area__";

type StatusFilter = "all" | "active" | "inactive";

/** Visual status for a table, driven by live orders (falls back to isActive). */
type TableStatus = "available" | "occupied" | "kot" | "inactive";

const STATUS_STYLES: Record<
  TableStatus,
  {
    label: string;
    pill: "green" | "neutral" | "red" | "purple";
    circle: string;
    chair: string;
    name: string;
  }
> = {
  available: {
    label: "Available",
    pill: "green",
    circle: "bg-emerald-50 text-emerald-700",
    chair: "bg-emerald-300",
    name: "text-emerald-700",
  },
  occupied: {
    label: "Occupied",
    pill: "red",
    circle: "bg-red-50 text-red-600",
    chair: "bg-red-300",
    name: "text-red-600",
  },
  kot: {
    label: "KOT",
    pill: "purple",
    circle: "bg-violet-50 text-violet-700",
    chair: "bg-violet-300",
    name: "text-violet-700",
  },
  inactive: {
    label: "Inactive",
    pill: "neutral",
    circle: "bg-slate-100 text-slate-500",
    chair: "bg-slate-300",
    name: "text-slate-500",
  },
};

function statusOf(table: DiningTable, stat?: TableStat): TableStatus {
  if (!table.isActive) return "inactive";
  if (stat?.status === "kot") return "kot";
  if (stat) return "occupied";
  return "available";
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "N/A";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function TableManager() {
  const { tables, loading, error, refetch } = useTables();
  const { branches } = useBranches();
  const { areas } = useAreas();
  const { byTable, refetch: refetchStats } = useTableStats();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [branchId, setBranchId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [area, setArea] = useState<string>(ALL);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((t) => {
      if (branchId !== "all" && t.branchId !== branchId) return false;
      if (status === "active" && !t.isActive) return false;
      if (status === "inactive" && t.isActive) return false;
      if (q && !`${t.name} ${t.area?.name ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tables, search, branchId, status]);

  /** Count per area id (over the search/filter result, so tab counts track filters). */
  const countFor = (areaId: string) =>
    searched.filter((t) => (areaId === NO_AREA ? !t.areaId : t.areaId === areaId)).length;

  const hasUnassigned = searched.some((t) => !t.areaId);

  const filtered = useMemo(() => {
    if (area === ALL) return searched;
    if (area === NO_AREA) return searched.filter((t) => !t.areaId);
    return searched.filter((t) => t.areaId === area);
  }, [searched, area]);

  const activeFilters = (branchId !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0);

  const openCreate = () => setDialogOpen(true);
  const clearFilters = () => {
    setBranchId("all");
    setStatus("all");
  };

  const confirm = useConfirm();

  /** Close a table's session — settle every open order on it and free the table. */
  const closeTable = async (table: DiningTable) => {
    const ok = await confirm({
      title: `Close table "${table.name}"?`,
      description:
        "Settles every open order on this table as paid and frees it for the next guests.",
      confirmLabel: "Close & settle",
    });
    if (!ok) return;
    try {
      const { closed } = await orderService.closeTable(table.id, true);
      toast(
        closed > 0
          ? `Table closed — ${closed} order${closed === 1 ? "" : "s"} settled`
          : "Table already free",
        {
          tone: "success",
        },
      );
      refetchStats();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to close table", { tone: "error" });
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Tables</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {tables.length} table{tables.length === 1 ? "" : "s"} · manage your floor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables…"
              className="h-9 w-44 pl-9"
              aria-label="Search tables"
            />
          </div>
          <Button
            variant={showFilters || activeFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="size-4" /> Filter
            {activeFilters > 0 && (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Branch
            <Dropdown
              className="w-44"
              value={branchId}
              onChange={(v) => setBranchId(v)}
              searchable
              aria-label="Filter by branch"
              options={[
                { value: "all", label: "All" },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <Dropdown
              className="w-40"
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              aria-label="Filter by status"
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Available" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      )}

      {/* Area tabs — segmented control */}
      <SegmentedTabs
        className="mt-4"
        aria-label="Filter tables by area"
        value={area}
        onChange={setArea}
        tabs={[
          { key: ALL, label: "All Areas", count: tables.length },
          ...areas.map((a) => ({ key: a.id, label: a.name, count: countFor(a.id) })),
          ...(hasUnassigned ? [{ key: NO_AREA, label: "No area", count: countFor(NO_AREA) }] : []),
        ]}
      />

      {/* Cards */}
      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-0">
            <EmptyState
              className="py-12"
              icon={Table2}
              title="Couldn't load tables"
              description={error}
              action={
                <Button variant="outline" onClick={refetch}>
                  Retry
                </Button>
              }
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              className="py-12"
              icon={Table2}
              title={tables.length === 0 ? "No tables yet" : "No matches"}
              description={
                tables.length === 0
                  ? "Add your first table to set up the floor."
                  : "Try adjusting your search, filters or area."
              }
              action={
                tables.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Plus className="size-4" /> Add Table
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {filtered.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                stat={byTable.get(table.id)}
                onClose={() => closeTable(table)}
              />
            ))}
          </div>
        )}
      </div>

      <TableFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        table={null}
        onSaved={refetch}
      />
    </div>
  );
}

function TableGlyph({ name, status }: { name: string; status: TableStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <div className="relative size-[74px] shrink-0">
      {/* chairs */}
      <span
        className={cn("absolute left-1/2 top-0 h-2 w-6 -translate-x-1/2 rounded-full", s.chair)}
      />
      <span
        className={cn("absolute bottom-0 left-1/2 h-2 w-6 -translate-x-1/2 rounded-full", s.chair)}
      />
      <span
        className={cn("absolute left-0 top-1/2 h-6 w-2 -translate-y-1/2 rounded-full", s.chair)}
      />
      <span
        className={cn("absolute right-0 top-1/2 h-6 w-2 -translate-y-1/2 rounded-full", s.chair)}
      />
      {/* table top */}
      <div
        className={cn(
          "absolute inset-1.5 flex items-center justify-center rounded-full px-1 text-center text-[11px] font-semibold leading-tight",
          s.circle,
        )}
      >
        <span className="line-clamp-2">{name}</span>
      </div>
    </div>
  );
}

function TableCard({
  table,
  stat,
  onClose,
}: {
  table: DiningTable;
  stat?: TableStat;
  onClose: () => void;
}) {
  const status = statusOf(table, stat);
  const s = STATUS_STYLES[status];

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <TableGlyph name={table.name} status={status} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm text-muted-foreground">
            Capacity: <span className="font-medium text-ink">{table.capacity}</span>
          </span>
          <StatusPill tone={s.pill}>{s.label}</StatusPill>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">
          {stat
            ? `${stat.orderCount} order${stat.orderCount === 1 ? "" : "s"} · ${stat.itemCount} item${stat.itemCount === 1 ? "" : "s"}`
            : "No orders"}
        </span>
        <span className="text-sm font-semibold text-ink">{formatMoney(stat?.total ?? 0)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {stat ? (
          <StatusPill tone={ORDER_STATUS_META[stat.orderStatus].tone}>
            {ORDER_STATUS_META[stat.orderStatus].label}
          </StatusPill>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {stat ? relativeTime(stat.lastOrderAt) : "N/A"}
        </span>
      </div>

      {stat && (
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onClose}>
          <CheckCircle2 className="size-4" />
          Close table
        </Button>
      )}
    </Card>
  );
}
