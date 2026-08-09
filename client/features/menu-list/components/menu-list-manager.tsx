"use client";

import { useState } from "react";
import { BookOpen, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";

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
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { usePaginatedMenus } from "@/features/menu-list/hooks/use-paginated-menus";
import { menusService } from "@/features/menu-list/services/menu.service";
import { MenuFormDialog } from "@/features/menu-list/components/menu-form-dialog";
import type { Menu } from "@/features/menu-list/types/menu.types";

type StatusFilter = "all" | "active" | "inactive";

export function MenuListManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");

  // Search + status are applied server-side; the list is paginated.
  const isActive = status === "all" ? undefined : status === "active";
  const {
    menus,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedMenus({ search, isActive });

  const activeFilters = status !== "all" ? 1 : 0;
  const filtersActive = Boolean(search.trim()) || status !== "all";

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (menu: Menu) => {
    setEditing(menu);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (menu: Menu) => {
    if (!(await confirm({ title: `Delete "${menu.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await menusService.remove(menu.id);
      toast("Menu deleted", { tone: "success" });
      // Step back a page if we just removed the last row on it.
      if (menus.length === 1 && page > 1) goToPage(page - 1);
      else refetch();
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
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Menu</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} menu{totalItems === 1 ? "" : "s"} · organize your offerings.
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
          {menus.length} of {totalItems}
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
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStatus("all")}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      )}

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
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
        ) : menus.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={BookOpen}
            title={filtersActive ? "No matches" : "No menus yet"}
            description={
              filtersActive
                ? "Try adjusting your search or filters."
                : "Add your first menu to get started."
            }
            action={
              filtersActive ? undefined : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add menu
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>
                    <AppImage
                      src={menu.imageUrl}
                      alt={menu.name}
                      width={40}
                      height={40}
                      fallbackIcon={BookOpen}
                      className="size-10 rounded-lg object-cover"
                      fallbackClassName="size-10 rounded-lg"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{menu.name}</TableCell>
                  <TableCell className="text-muted-foreground">{menu.description || "—"}</TableCell>
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

      {!loading && !error && menus.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <MenuFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        menu={editing}
        onSaved={refetch}
      />
    </div>
  );
}
