"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Table2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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

import { useTables } from "@/features/table/hooks/use-tables";
import { tableService } from "@/features/table/services/table.service";
import { TableFormDialog } from "@/features/table/components/table-form-dialog";
import type { DiningTable } from "@/features/table/types/table.types";

/** Plain tabular listing of tables (config view). */
export function TableListManager() {
  const { tables, loading, error, refetch } = useTables();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTable | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) =>
      `${t.name} ${t.area?.name ?? ""} ${t.branch?.name ?? ""}`.toLowerCase().includes(q),
    );
  }, [tables, search]);

  const openCreate = () => {
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
            {tables.length} table{tables.length === 1 ? "" : "s"} · list view.
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
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Table2}
            title={tables.length === 0 ? "No tables yet" : "No matches"}
            description={
              tables.length === 0 ? "Add your first table." : "Try a different search."
            }
            action={
              tables.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add table
                </Button>
              ) : undefined
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.area?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.capacity}</TableCell>
                  <TableCell className="text-muted-foreground">{t.branch?.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusPill tone={t.isActive ? "green" : "neutral"}>
                      {t.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(t)}>
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

      <TableFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        table={editing}
        onSaved={refetch}
      />
    </div>
  );
}
