"use client";

import { useState } from "react";
import { PartyPopper, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/utils";

import { usePaginatedEventTypes } from "@/features/event/hooks/use-paginated-event-types";
import { eventTypeService } from "@/features/event/services/event-type.service";
import { EventTypeFormDialog } from "@/features/event/components/event-type-form-dialog";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import type { EventType } from "@/features/event/types/event.types";

export function EventTypeManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [search, setSearch] = useState("");
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();

  const {
    eventTypes,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedEventTypes({ search, branchId });

  const filtersActive = Boolean(search.trim());

  const openCreate = () => {
    if (!branchId) {
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (eventType: EventType) => {
    setEditing(eventType);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (eventType: EventType) => {
    if (!(await confirm({ title: `Delete "${eventType.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await eventTypeService.remove(eventType.id);
      if (eventTypes.length === 1 && page > 1) goToPage(page - 1);
      else refetch();
    } catch {}
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            Event Types
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} type{totalItems === 1 ? "" : "s"} · what guests can book.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add event type
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event types…"
            className="h-9 pl-9"
            aria-label="Search event types"
          />
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {eventTypes.length} of {totalItems}
        </span>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={PartyPopper}
            title="Couldn't load event types"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : eventTypes.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={PartyPopper}
            title={filtersActive ? "No matches" : "No event types yet"}
            description={
              filtersActive
                ? "Try a different search."
                : "Add your first event type so guests can start booking."
            }
            action={
              filtersActive ? undefined : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add event type
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
                <TableHead>From</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventTypes.map((eventType) => (
                <TableRow key={eventType.id}>
                  <TableCell>
                    <AppImage
                      src={eventType.imageUrl}
                      alt={eventType.name}
                      width={40}
                      height={40}
                      fallbackIcon={PartyPopper}
                      className="size-10 rounded-lg object-cover"
                      fallbackClassName="size-10 rounded-lg"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{eventType.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {eventType.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {eventType.basePrice ? formatCurrency(Number(eventType.basePrice)) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{eventType.sortOrder}</TableCell>
                  <TableCell>
                    <StatusPill tone={eventType.isActive ? "green" : "neutral"}>
                      {eventType.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(eventType)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(eventType)}
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

      {!loading && !error && eventTypes.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <EventTypeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventType={editing}
        branchId={branchId}
        onSaved={refetch}
      />
    </div>
  );
}
