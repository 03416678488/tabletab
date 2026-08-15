"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Table2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { usePaginatedTables } from "@/features/table/hooks/use-paginated-tables";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { useTableStats } from "@/features/order/hooks/use-table-stats";
import { tableService } from "@/features/table/services/table.service";
import { TableFormDialog } from "@/features/table/components/table-form-dialog";
import type { DiningTable } from "@/features/table/types/table.types";

/** Live occupancy for a table, driven by active orders (independent of the
 *  Active/Inactive config flag). */
const OCCUPANCY: Record<
  "available" | "occupied" | "kot",
  { tone: "green" | "red" | "purple"; label: string }
> = {
  available: { tone: "green", label: "Available" },
  occupied: { tone: "red", label: "Occupied" },
  kot: { tone: "purple", label: "KOT" },
};

/** Plain tabular listing of tables (config view). */
export function TableListManager() {
  const [search, setSearch] = useState("");
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const {
    tables,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedTables({ search, branchId });
  // Live per-table occupancy (active orders), scoped to the topbar branch and
  // reconciled over SSE — same source as the floor view.
  const { byTable } = useTableStats();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTable | null>(null);

  const openCreate = () => {
    if (!branchId) {
      toast("Select a branch first to add a table", { tone: "info" });
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (t: DiningTable) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (t: DiningTable) => {
    if (!(await confirm({ title: `Delete "${t.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await tableService.remove(t.id);
      toast("Table deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete table", { tone: "error" });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Tables</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} table{totalItems === 1 ? "" : "s"} · list view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables…"
              className="h-9 pl-9"
              aria-label="Search tables"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> Add table
          </Button>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
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
        ) : tables.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Table2}
            title={search.trim() ? "No matches" : "No tables yet"}
            description={search.trim() ? "Try a different search." : "Add your first table."}
            action={
              search.trim() ? undefined : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add table
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.area?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.capacity}</TableCell>
                  <TableCell className="text-muted-foreground">{t.branch?.name ?? "—"}</TableCell>
                  <TableCell>
                    {(() => {
                      if (!t.isActive) {
                        return <span className="text-sm text-muted-foreground">—</span>;
                      }
                      const stat = byTable.get(t.id);
                      const key = stat?.status === "kot" ? "kot" : stat ? "occupied" : "available";
                      const { tone, label } = OCCUPANCY[key];
                      return (
                        <StatusPill tone={tone}>
                          {label}
                          {stat
                            ? ` · ${stat.itemCount} item${stat.itemCount === 1 ? "" : "s"}`
                            : ""}
                        </StatusPill>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={t.isActive ? "green" : "neutral"}>
                      {t.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(t)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {!loading && !error && tables.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <TableFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        table={editing}
        defaultBranchId={branchId}
        onSaved={refetch}
      />
    </div>
  );
}
