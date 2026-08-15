"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Eye,
  Phone,
  RefreshCw,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationStatusPill, StatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { toast } from "@/hooks/use-toast";
import {
  listReservations,
  setReservationStatus,
  type StorefrontReservation,
} from "@/features/reserve/services/reservation.service";
import { fetchReservationSettings } from "@/features/reserve/services/reservation-settings.service";
import { useReservationsStream } from "@/features/manager/hooks/use-reservations-stream";
import { deriveReservationTasks, formatSlotLabel } from "@/lib/reservation-utils";
import { formatDateTime } from "@/lib/datetime";
import type { ReservationTask } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const ACTIVE_RESERVATION = new Set(["requested", "confirmed", "seated"]);

export function ReservationsPanel() {
  const activeBranch = useSession((s) => s.activeBranch);
  // Follow the topbar branch switcher — "All branches" → undefined lists every
  // branch's reservations (per-branch settings just don't load in that view).
  const branchId = useScopedBranchId();
  const [reservations, setReservations] = useState<StorefrontReservation[]>([]);
  // Reminder lead (mins) from the branch's settings; drives the reminder tasks.
  const [reminderLead, setReminderLead] = useState(30);
  // Per-guest booking deposit from settings; 0 = confirm without a deposit step.
  const [depositPerGuest, setDepositPerGuest] = useState(0);
  // Deposit-on-confirm dialog.
  const [confirmFor, setConfirmFor] = useState<StorefrontReservation | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<"cash" | "card" | "mfs" | "other">("cash");
  // Tasks are derived from real bookings; "Mark done" hides them client-side.
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Read-only "view details" dialog.
  const [detailFor, setDetailFor] = useState<StorefrontReservation | null>(null);

  const refresh = async () => {
    try {
      setReservations(await listReservations(branchId));
    } catch {
      /* keep the last good data; a failed refresh must not blank the panel */
    } finally {
      setLoading(false);
    }
  };

  // Reminder lead comes from the selected branch's reservation settings.
  useEffect(() => {
    if (!branchId) return;
    fetchReservationSettings(branchId)
      .then((s) => {
        setReminderLead(s.reminderLeadMins);
        setDepositPerGuest(s.depositPerGuest);
      })
      .catch(() => undefined);
  }, [branchId]);

  useEffect(() => {
    void refresh();
    // Slow poll as a safety net — realtime below delivers the instant updates.
    const poll = setInterval(() => void refresh(), 30000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // Live reservation book — new bookings + status changes reflect instantly.
  useReservationsStream(refresh);

  // Local Y-M-D (not UTC — avoids hiding today's bookings in +offset zones).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const upcoming = useMemo(
    () => reservations.filter((r) => r.date >= today && ACTIVE_RESERVATION.has(r.status)),
    [reservations, today],
  );

  const openTasks = useMemo(
    () => deriveReservationTasks(reservations, reminderLead).filter((t) => !dismissed.has(t.id)),
    [reservations, reminderLead, dismissed],
  );

  const urgentTasks = openTasks.filter((t) => t.type === "urgent-confirm");
  const reminderTasks = openTasks.filter((t) => t.type === "reminder");

  const dismissTask = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    toast("Task dismissed", { tone: "success" });
  };

  const tableLabel = (tableId: string) =>
    activeBranch?.tables?.find((t) => t.id === tableId)?.label ?? tableId;

  // Confirm: with a per-guest deposit configured, open the collect-deposit
  // dialog (prefilled to deposit × party size); otherwise confirm straight away.
  const startConfirm = (r: StorefrontReservation) => {
    if (depositPerGuest > 0) {
      setDepositAmount((depositPerGuest * r.partySize).toFixed(2));
      setDepositMethod("cash");
      setConfirmFor(r);
    } else {
      void runAction(
        r.id,
        () => setReservationStatus(r.id, "confirmed"),
        "Reservation confirmed — table held",
      );
    }
  };

  const submitConfirm = async (withDeposit: boolean) => {
    const r = confirmFor;
    if (!r) return;
    const amount = withDeposit ? Number(depositAmount) || 0 : 0;
    setConfirmFor(null);
    await runAction(
      r.id,
      () =>
        setReservationStatus(
          r.id,
          "confirmed",
          amount > 0 ? { depositAmount: amount, depositMethod } : undefined,
        ),
      amount > 0
        ? `Confirmed — ${formatCurrency(amount)} deposit recorded`
        : "Reservation confirmed — table held",
    );
  };

  const runAction = async (id: string, action: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    try {
      await action();
      toast(message, { tone: "success" });
      await refresh();
    } catch {
      toast("Action failed", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tasks */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <AlertTriangle className="size-5 text-amber-600" />
          Reservation tasks
          {openTasks.length > 0 && <StatusPill tone="amber">{openTasks.length} open</StatusPill>}
        </h2>

        {openTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No pending reminders or confirmation calls.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {urgentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                urgent
                busy={busyId === task.id}
                onDismiss={() => dismissTask(task.id)}
              />
            ))}
            {reminderTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busyId === task.id}
                onDismiss={() => dismissTask(task.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Reservations list */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <CalendarDays className="size-5 text-brand" />
            Today &amp; upcoming
          </h2>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming reservations"
            description="New online bookings will appear here."
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display font-semibold text-ink">{r.guestName}</p>
                        <ReservationStatusPill status={r.status} dot={false} />
                        {r.date === today && (
                          <StatusPill tone="brand" dot={false}>
                            Today
                          </StatusPill>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatSlotLabel(r.date, r.time)} · {r.partySize} guests · Table{" "}
                        {r.tableName ?? tableLabel(r.tableId)}
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="size-3.5" />
                        {r.guestPhone}
                      </p>
                      {r.buffet && (
                        <p className="text-sm text-amber-800">
                          Buffet: {r.buffet.packageName} · {r.buffet.totalCovers} covers (
                          {formatCurrency(r.buffet.subtotal)})
                        </p>
                      )}
                      {r.preOrder && r.preOrder.length > 0 && (
                        <p className="text-sm text-brand-deep">
                          Pre-order: {r.preOrder.map((i) => `${i.quantity}× ${i.name}`).join(", ")}{" "}
                          (
                          {formatCurrency(
                            r.preOrder.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
                          )}
                          )
                        </p>
                      )}
                      {r.specialRequests && (
                        <p className="text-sm italic text-muted-foreground">
                          &ldquo;{r.specialRequests}&rdquo;
                        </p>
                      )}
                      {(r.depositAmount ?? 0) > 0 && (
                        <p className="text-sm font-medium text-emerald-700">
                          Deposit paid: {formatCurrency(r.depositAmount ?? 0)}
                          {r.depositMethod ? ` · ${r.depositMethod}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="View reservation details"
                        onClick={() => setDetailFor(r)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {r.status === "requested" && (
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => startConfirm(r)}
                        >
                          <Check className="size-4" />
                          Confirm
                        </Button>
                      )}
                      {r.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() =>
                            runAction(
                              r.id,
                              () => setReservationStatus(r.id, "seated"),
                              "Guest seated",
                            )
                          }
                        >
                          <UserCheck className="size-4" />
                          Seat
                        </Button>
                      )}
                      {(r.status === "seated" || r.status === "confirmed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() =>
                            runAction(
                              r.id,
                              () => setReservationStatus(r.id, "completed"),
                              "Completed",
                            )
                          }
                        >
                          Complete
                        </Button>
                      )}
                      {["requested", "confirmed"].includes(r.status) && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={busyId === r.id}
                            onClick={() =>
                              runAction(
                                r.id,
                                () => setReservationStatus(r.id, "no-show"),
                                "Marked no-show",
                              )
                            }
                          >
                            No-show
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === r.id}
                            onClick={() =>
                              runAction(
                                r.id,
                                () => setReservationStatus(r.id, "cancelled"),
                                "Cancelled",
                              )
                            }
                          >
                            <X className="size-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!detailFor} onOpenChange={(open) => !open && setDetailFor(null)}>
        <DialogContent className="max-w-lg">
          {detailFor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {detailFor.guestName}
                  <ReservationStatusPill status={detailFor.status} dot={false} />
                </DialogTitle>
              </DialogHeader>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Detail
                    label="When"
                    value={`${formatSlotLabel(detailFor.date, detailFor.time)} · ${detailFor.durationMins} min`}
                  />
                  <Detail label="Party size" value={`${detailFor.partySize} guests`} />
                  <Detail
                    label="Table"
                    value={detailFor.tableName ?? tableLabel(detailFor.tableId)}
                  />
                  <Detail label="Source" value={detailFor.source} />
                  <Detail label="Phone" value={detailFor.guestPhone} />
                  {detailFor.guestEmail && <Detail label="Email" value={detailFor.guestEmail} />}
                  {detailFor.branchName && <Detail label="Branch" value={detailFor.branchName} />}
                </dl>

                {detailFor.specialRequests && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Special requests
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink">
                      {detailFor.specialRequests}
                    </p>
                  </div>
                )}

                {detailFor.buffet && (
                  <div className="text-sm text-amber-800">
                    Buffet: {detailFor.buffet.packageName} · {detailFor.buffet.totalCovers} covers (
                    {formatCurrency(detailFor.buffet.subtotal)})
                  </div>
                )}
                {detailFor.preOrder && detailFor.preOrder.length > 0 && (
                  <div className="text-sm text-brand-deep">
                    Pre-order:{" "}
                    {detailFor.preOrder.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
                  <Detail label="Booked" value={formatDateTime(detailFor.createdAt)} />
                  {detailFor.confirmedAt && (
                    <Detail label="Confirmed" value={formatDateTime(detailFor.confirmedAt)} />
                  )}
                  {detailFor.seatedAt && (
                    <Detail label="Seated" value={formatDateTime(detailFor.seatedAt)} />
                  )}
                  {detailFor.completedAt && (
                    <Detail label="Completed" value={formatDateTime(detailFor.completedAt)} />
                  )}
                  {(detailFor.depositAmount ?? 0) > 0 && (
                    <Detail
                      label="Deposit"
                      value={`${formatCurrency(detailFor.depositAmount ?? 0)}${
                        detailFor.depositMethod ? ` · ${detailFor.depositMethod}` : ""
                      }`}
                    />
                  )}
                </dl>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailFor(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm + record booking deposit */}
      <Dialog open={!!confirmFor} onOpenChange={(o) => !o && setConfirmFor(null)}>
        <DialogContent className="max-w-md">
          {confirmFor && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm reservation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-1">
                <p className="text-sm text-muted-foreground">
                  {confirmFor.guestName} · {confirmFor.partySize} guests ·{" "}
                  {formatSlotLabel(confirmFor.date, confirmFor.time)}
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Booking deposit</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="h-9 w-32 rounded-lg border border-input bg-white px-3 text-sm text-ink outline-none focus-visible:border-brand"
                    />
                    <select
                      value={depositMethod}
                      onChange={(e) => setDepositMethod(e.target.value as typeof depositMethod)}
                      className="h-9 rounded-lg border border-input bg-white px-2 text-sm text-ink outline-none focus-visible:border-brand"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mfs">MFS</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Suggested {formatCurrency(depositPerGuest)}/guest — recorded as a transaction
                    and counted in reports.
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => submitConfirm(false)}>
                  Skip deposit
                </Button>
                <Button onClick={() => submitConfirm(true)}>
                  <Check className="size-4" />
                  Confirm &amp; record
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function TaskCard({
  task,
  urgent,
  busy,
  onDismiss,
}: {
  task: ReservationTask;
  urgent?: boolean;
  busy?: boolean;
  onDismiss: () => void;
}) {
  const isPending = task.status === "pending";

  return (
    <Card
      className={cn(
        urgent && "border-red-300 bg-red-50/90 ring-2 ring-red-200",
        !urgent && "border-amber-200 bg-accent-tint/40",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {urgent ? (
            <AlertTriangle className="size-4 text-red-600" />
          ) : (
            <Phone className="size-4 text-amber-700" />
          )}
          {urgent ? "URGENT — Call to confirm" : "Reservation reminder"}
          {isPending && (
            <StatusPill tone="neutral" dot={false}>
              Scheduled
            </StatusPill>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium text-ink">{task.guestName}</p>
        <p className="text-sm text-muted-foreground">{task.slotLabel}</p>
        <p className="flex items-center gap-1.5 text-sm">
          <Phone className="size-3.5" />
          <a href={`tel:${task.guestPhone}`} className="font-medium text-brand hover:underline">
            {task.guestPhone}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">{task.message}</p>
        {!isPending && (
          <Button size="sm" variant="outline" disabled={busy} onClick={onDismiss}>
            Mark done
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
