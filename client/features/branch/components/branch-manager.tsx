"use client";

import { useMemo, useState } from "react";
import { MapPin, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

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
import { cn } from "@/lib/utils";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { branchService } from "@/features/branch/services/branch.service";
import { BranchFormDialog } from "@/features/branch/components/branch-form-dialog";
import type { Branch } from "@/features/branch/types/branch.types";

const SELECT_CLASS =
  "h-9 appearance-none rounded-lg border border-input bg-white px-3 pr-8 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

type StatusFilter = "all" | "open" | "closed";

export function BranchManager() {
  const { branches, loading, error, refetch } = useBranches();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [city, setCity] = useState<string>("all");

  const cities = useMemo(
    () => Array.from(new Set(branches.map((b) => b.city).filter(Boolean))).sort(),
    [branches],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      if (status === "open" && !b.isOpen) return false;
      if (status === "closed" && b.isOpen) return false;
      if (city !== "all" && b.city !== city) return false;
      if (q) {
        const hay = `${b.name} ${b.address} ${b.city} ${b.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [branches, search, status, city]);

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
      toast("Branch deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete branch", {
        tone: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            Branches
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {branches.length} location{branches.length === 1 ? "" : "s"} · manage your restaurant network.
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
          {filtered.length} of {branches.length}
        </span>
      </div>

      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <select
              className={SELECT_CLASS}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            City
            <select
              className={SELECT_CLASS}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="all">All</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
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
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
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
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={MapPin}
            title={branches.length === 0 ? "No branches yet" : "No matches"}
            description={
              branches.length === 0
                ? "Add your first branch to get started."
                : "Try adjusting your search or filters."
            }
            action={
              branches.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add branch
                </Button>
              ) : undefined
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
              {filtered.map((branch) => (
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

      <BranchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editing}
        onSaved={refetch}
      />
    </div>
  );
}
