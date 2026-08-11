"use client";

import { useState } from "react";
import { Search, UtensilsCrossed } from "lucide-react";

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
import { Button } from "@/components/ui/button";

import { usePaginatedRecipeItems } from "@/features/inventory/hooks/use-paginated-recipe-items";
import { RecipeEditorDialog } from "@/features/inventory/components/recipe-editor-dialog";
import type { MenuItem } from "@/features/menu/types/menu.types";

const TRACKING_META: Record<
  "none" | "recipe" | "unit",
  { label: string; tone: "neutral" | "green" | "blue" }
> = {
  none: { label: "Not tracked", tone: "neutral" },
  recipe: { label: "Recipe", tone: "green" },
  unit: { label: "Unit", tone: "blue" },
};

export function RecipeManager() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [open, setOpen] = useState(false);

  const {
    items,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedRecipeItems({ search: search.trim() || undefined });

  const edit = (item: MenuItem) => {
    setEditing(item);
    setOpen(true);
  };

  return (
    <div className="w-full">
      <div className="relative mt-1 min-w-[200px] max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items…"
          className="pl-9"
        />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={UtensilsCrossed}
            title="Couldn't load"
            description={error}
            action={<button onClick={refetch}>Retry</button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={UtensilsCrossed}
            title="No menu items"
            description="Create menu items first, then wire them to stock here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Menu item</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const meta = TRACKING_META[item.trackingType ?? "none"];
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-ink">{item.name}</TableCell>
                      <TableCell>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => edit(item)}>
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {!loading && !error && items.length > 0 && (
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

      <RecipeEditorDialog open={open} onOpenChange={setOpen} menuItem={editing} onSaved={refetch} />
    </div>
  );
}
