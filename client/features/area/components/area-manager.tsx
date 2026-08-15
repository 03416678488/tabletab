"use client";

import { useState } from "react";
import { LayoutGrid, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
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

import { usePaginatedAreas } from "@/features/area/hooks/use-paginated-areas";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { Pagination } from "@/components/ui/pagination";
import { areaService } from "@/features/area/services/area.service";
import { AreaFormDialog } from "@/features/area/components/area-form-dialog";
import type { Area } from "@/features/area/types/area.types";

export function AreaManager() {
  const [search, setSearch] = useState("");
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const {
    areas,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedAreas({ search, branchId });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);

  const openCreate = () => {
    if (!branchId) {
      toast("Select a branch first to add an area", { tone: "info" });
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (area: Area) => {
    setEditing(area);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (area: Area) => {
    if (!(await confirm({ title: `Delete "${area.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await areaService.remove(area.id);
      toast("Area deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete area", {
        tone: "error",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Areas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} area{totalItems === 1 ? "" : "s"} · group tables by area.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add area
        </Button>
      </div>

      <div className="mt-5">
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search areas…"
            className="h-9 pl-9"
            aria-label="Search areas"
          />
        </div>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={LayoutGrid}
            title="Couldn't load areas"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : areas.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={LayoutGrid}
            title={search.trim() ? "No matches" : "No areas yet"}
            description={
              areas.length === 0
                ? "Add your first area to group tables."
                : "Try a different search."
            }
            action={
              areas.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add area
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(area)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(area)}
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

      {!loading && !error && areas.length > 0 && (
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

      <AreaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        area={editing}
        branchId={branchId}
        onSaved={refetch}
      />
    </div>
  );
}
