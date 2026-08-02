"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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

import { useMenus } from "@/features/menu-list/hooks/use-menus";
import { menusService } from "@/features/menu-list/services/menu.service";
import { MenuFormDialog } from "@/features/menu-list/components/menu-form-dialog";
import type { Menu } from "@/features/menu-list/types/menu.types";

const SELECT_CLASS =
  "h-9 appearance-none rounded-lg border border-input bg-white px-3 pr-8 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

type StatusFilter = "all" | "active" | "inactive";

export function MenuListManager() {
  const { menus, loading, error, refetch } = useMenus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menus.filter((m) => {
      if (status === "active" && !m.isActive) return false;
      if (status === "inactive" && m.isActive) return false;
      if (q && !`${m.name} ${m.description ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [menus, search, status]);

  const activeFilters = status !== "all" ? 1 : 0;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (menu: Menu) => {
    setEditing(menu);
    setDialogOpen(true);
  };

  const remove = async (menu: Menu) => {
    if (!confirm(`Delete "${menu.name}"?`)) return;
    try {
      await menusService.remove(menu.id);
      toast("Menu deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete menu", {
        tone: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            Menu
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {menus.length} menu{menus.length === 1 ? "" : "s"} · organize your offerings.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add menu
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menus…"
            className="h-9 pl-9"
            aria-label="Search menus"
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
          {filtered.length} of {menus.length}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStatus("all")}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      )}

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={BookOpen}
            title="Couldn't load menus"
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
            icon={BookOpen}
            title={menus.length === 0 ? "No menus yet" : "No matches"}
            description={
              menus.length === 0
                ? "Add your first menu to get started."
                : "Try adjusting your search or filters."
            }
            action={
              menus.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add menu
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell className="font-medium">{menu.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {menu.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{menu.sortOrder}</TableCell>
                  <TableCell>
                    <StatusPill tone={menu.isActive ? "green" : "neutral"}>
                      {menu.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(menu)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(menu)}
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

      <MenuFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        menu={editing}
        onSaved={refetch}
      />
    </div>
  );
}
