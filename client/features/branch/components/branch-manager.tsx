"use client";

import { useMemo, useState } from "react";
import { MapPin, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { usePaginatedBranches } from "@/features/branch/hooks/use-paginated-branches";
import { branchService } from "@/features/branch/services/branch.service";
import { BranchFormDialog } from "@/features/branch/components/branch-form-dialog";
import type { Branch } from "@/features/branch/types/branch.types";

type StatusFilter = "all" | "open" | "closed";

export function BranchManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [city, setCity] = useState<string>("all");

  const {
    branches,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedBranches({
    search,
    city,
    isOpen: status === "all" ? undefined : status === "open",
  });

  // Full list (small dataset) used only to populate the city filter dropdown.
  const { branches: allBranches } = useBranches();
  const cities = useMemo(
    () => Array.from(new Set(allBranches.map((b) => b.city).filter(Boolean))).sort(),
    [allBranches],
  );

  const activeFilters = (status !== "all" ? 1 : 0) + (city !== "all" ? 1 : 0);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setDialogOpen(true);
  };
  const clearFilters = () => {
    setStatus("all");
    setCity("all");
  };

  const confirm = useConfirm();

  const remove = async (branch: Branch) => {
    const ok = await confirm({
      title: `Delete "${branch.name}"?`,
      description: "This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await branchService.remove(branch.id);
      refetch();
    } catch {}
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Branches</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} location{totalItems === 1 ? "" : "s"} · manage your restaurant network.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add branch
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search branches…"
            className="h-9 pl-9"
            aria-label="Search branches"
          />
        </div>
        <Button
          variant={showFilters || activeFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="size-4" /> Filters
          {activeFilters > 0 && (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
              {activeFilters}
            </span>
          )}
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {branches.length} of {totalItems}
        </span>
      </div>

      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <Dropdown
              className="w-40"
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              aria-label="Filter by status"
              options={[
                { value: "all", label: "All" },
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            City
            <Dropdown
              className="w-44"
              value={city}
              onChange={(v) => setCity(v)}
              searchable
              aria-label="Filter by city"
              options={[
                { value: "all", label: "All" },
                ...cities.map((c) => ({ value: c, label: c })),
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

      {/* Table */}
      <Card className={cn("mt-4 overflow-hidden p-0")}>
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={MapPin}
            title="Couldn't load branches"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : branches.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={MapPin}
            title={search.trim() || activeFilters ? "No matches" : "No branches yet"}
            description={
              search.trim() || activeFilters
                ? "Try adjusting your search or filters."
                : "Add your first branch to get started."
            }
            action={
              search.trim() || activeFilters ? undefined : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add branch
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {branch.address}, {branch.city}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{branch.phone}</TableCell>
                  <TableCell>
                    <StatusPill tone={branch.isOpen ? "green" : "neutral"}>
                      {branch.isOpen ? "Open" : "Closed"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(branch)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(branch)}
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

      {!loading && !error && branches.length > 0 && (
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

      <BranchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editing}
        onSaved={refetch}
      />
    </div>
  );
}
