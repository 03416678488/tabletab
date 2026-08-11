"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { usePaginatedSuppliers } from "@/features/purchasing/hooks/use-paginated-suppliers";
import { purchasingService } from "@/features/purchasing/services/purchasing.service";
import { SupplierDialog } from "@/features/purchasing/components/supplier-dialog";
import type { Supplier } from "@/features/purchasing/types/purchasing.types";

export function SupplierManager() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

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
  } = usePaginatedSuppliers({ search: search.trim() || undefined });

  const create = () => {
    setEditing(null);
    setOpen(true);
  };
  const edit = (s: Supplier) => {
    setEditing(s);
    setOpen(true);
  };
  const remove = async (s: Supplier) => {
    const ok = await confirm({ title: `Delete ${s.name}?`, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await purchasingService.deleteSupplier(s.id);
      toast("Supplier deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't delete", { tone: "error" });
    }
  };

  return (
    <div className="w-full">
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="pl-9"
          />
        </div>
        <Button onClick={create}>
          <Plus className="mr-1.5 size-4" /> New supplier
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState className="py-12" icon={Truck} title="Couldn't load" description={error} />
        ) : items.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Truck}
            title="No suppliers"
            description="Add the vendors you buy stock from."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-ink">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.contactName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => edit(s)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(s)}>
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      <SupplierDialog open={open} onOpenChange={setOpen} supplier={editing} onSaved={refetch} />
    </div>
  );
}
