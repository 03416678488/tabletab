"use client";

import { useState } from "react";
import {
  CalendarDays,
  DollarSign,
  PartyPopper,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { InlineSelect } from "@/components/ui/inline-select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

import { usePaginatedEvents } from "@/features/event/hooks/use-paginated-events";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { eventService } from "@/features/event/services/event.service";
import { EventFormDialog } from "@/features/event/components/event-form-dialog";
import { EVENT_STATUSES } from "@/features/event/constants/event.constants";
import type { EventBooking, EventStatus } from "@/features/event/types/event.types";

const STATUS_TONE: Record<EventStatus, "amber" | "green" | "blue" | "red"> = {
  requested: "amber",
  confirmed: "blue",
  completed: "green",
  cancelled: "red",
};

const STATUS_LABEL: Record<EventStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

type StatusFilter = "all" | EventStatus;

export function EventManager() {
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelling, setCancelling] = useState<EventBooking | null>(null);
  const [reason, setReason] = useState("");
  const [savingCancel, setSavingCancel] = useState(false);
  // Record-payment dialog.
  const [payingFor, setPayingFor] = useState<EventBooking | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "mfs" | "other">("cash");
  const [savingPay, setSavingPay] = useState(false);

  const {
    events,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedEvents({ search, status: status === "all" ? undefined : status, branchId });

  const activeFilters = status !== "all" ? 1 : 0;
  const filtersActive = Boolean(search.trim()) || status !== "all";

  const confirm = useConfirm();

  const applyStatus = async (event: EventBooking, next: EventStatus, why?: string) => {
    try {
      await eventService.setStatus(event.id, next, why);
      refetch();
      return true;
    } catch {
      return false;
    }
  };

  const changeStatus = async (event: EventBooking, next: EventStatus) => {
    // Cancelling requires a reason — open the prompt instead of applying directly.
    if (next === "cancelled") {
      setReason(event.cancellationReason ?? "");
      setCancelling(event);
      return;
    }
    await applyStatus(event, next);
  };

  const confirmCancel = async () => {
    if (!cancelling || !reason.trim()) return;
    setSavingCancel(true);
    try {
      const ok = await applyStatus(cancelling, "cancelled", reason.trim());
      if (ok) {
        setCancelling(null);
        setReason("");
      }
    } finally {
      setSavingCancel(false);
    }
  };

  const startPayment = (event: EventBooking) => {
    setPayAmount(event.budget ?? "");
    setPayMethod("cash");
    setPayingFor(event);
  };

  const submitPayment = async () => {
    if (!payingFor) return;
    const amount = Number(payAmount) || 0;
    if (amount <= 0) return;
    setSavingPay(true);
    try {
      await eventService.recordPayment(payingFor.id, amount, payMethod);
      setPayingFor(null);
      refetch();
    } catch {
    } finally {
      setSavingPay(false);
    }
  };

  const remove = async (event: EventBooking) => {
    if (!(await confirm({ title: `Delete "${event.title}"?`, confirmLabel: "Delete" }))) return;
    try {
      await eventService.remove(event.id);
      if (events.length === 1 && page > 1) goToPage(page - 1);
      else refetch();
    } catch {}
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            Event Bookings
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} booking{totalItems === 1 ? "" : "s"} · guest event inquiries.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="size-4" /> Add booking
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest…"
            className="h-9 pl-9"
            aria-label="Search bookings"
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
          {events.length} of {totalItems}
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
                ...EVENT_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
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
            icon={PartyPopper}
            title="Couldn't load bookings"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : events.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={CalendarDays}
            title={filtersActive ? "No matches" : "No bookings yet"}
            description={
              filtersActive
                ? "Try adjusting your search or filters."
                : "Guest inquiries appear here — or add a booking taken by phone or walk-in."
            }
            action={
              filtersActive ? undefined : (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" /> Add booking
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Event</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-medium text-ink">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.eventType?.name ?? "—"}
                      {event.branch?.name ? ` · ${event.branch.name}` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-ink">{event.guestName}</div>
                    <div className="text-xs text-muted-foreground">{event.guestPhone}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.date}
                    <br />
                    {event.startTime}
                    {event.endTime ? `–${event.endTime}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{event.guestCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.budget ? formatCurrency(Number(event.budget)) : "—"}
                    {(event.paymentAmount ?? 0) > 0 && (
                      <div className="mt-0.5 text-xs font-medium text-emerald-700">
                        Paid {formatCurrency(event.paymentAmount ?? 0)}
                        {event.paymentMethod ? ` · ${event.paymentMethod}` : ""}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={STATUS_TONE[event.status]}>
                      {STATUS_LABEL[event.status]}
                    </StatusPill>
                    {event.status === "cancelled" && event.cancellationReason && (
                      <p
                        className="mt-1 max-w-[12rem] truncate text-xs text-muted-foreground"
                        title={event.cancellationReason}
                      >
                        {event.cancellationReason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <InlineSelect
                        value={event.status}
                        onChange={(v) => changeStatus(event, v as EventStatus)}
                        aria-label="Change status"
                        align="right"
                        options={EVENT_STATUSES.map((s) => ({
                          value: s,
                          label: STATUS_LABEL[s],
                        }))}
                      />
                      {event.status !== "cancelled" && !event.paymentCollectedAt && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Record payment"
                          title="Record payment"
                          onClick={() => startPayment(event)}
                        >
                          <DollarSign className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(event)}
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

      {!loading && !error && events.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <EventFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={refetch} />

      <Dialog
        open={!!cancelling}
        onOpenChange={(o) => {
          if (!o) {
            setCancelling(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel booking</DialogTitle>
            <DialogDescription>
              {cancelling ? `Let the team know why "${cancelling.title}" is being cancelled.` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Cancellation reason</Label>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Guest cancelled, double-booking, venue unavailable…"
              className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCancelling(null);
                setReason("");
              }}
            >
              Keep booking
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!reason.trim() || savingCancel}
              onClick={confirmCancel}
            >
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record event payment */}
      <Dialog open={!!payingFor} onOpenChange={(o) => !o && setPayingFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {payingFor
                ? `Collected against "${payingFor.title}" — posts a transaction and counts in reports.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="event-pay-amount">Amount</Label>
              <Input
                id="event-pay-amount"
                type="number"
                min={0}
                step="0.01"
                autoFocus
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-pay-method">Method</Label>
              <select
                id="event-pay-method"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                className="h-10 rounded-xl border border-input bg-white px-3 text-sm text-ink shadow-sm outline-none focus-visible:border-brand"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mfs">MFS</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPayingFor(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!(Number(payAmount) > 0) || savingPay}
              onClick={submitPayment}
            >
              <DollarSign className="size-4" />
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
