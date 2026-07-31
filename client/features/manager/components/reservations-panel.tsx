"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Phone,
  RefreshCw,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationStatusPill, StatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatSlotLabel } from "@/lib/reservation-utils";
import type { Reservation, ReservationTask } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const ACTIVE_RESERVATION = new Set(["requested", "confirmed", "seated"]);

export function ReservationsPanel() {
  const activeBranch = useSession((s) => s.activeBranch);
  const user = useSession((s) => s.user);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tasks, setTasks] = useState<ReservationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    const [r, t] = await Promise.all([
      api.getReservations(activeBranch.id),
      api.getReservationTasks(activeBranch.id),
    ]);
    setReservations(r);
    setTasks(t);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 8000);
    return () => clearInterval(poll);
  }, [activeBranch.id]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(
    () =>
      reservations.filter(
        (r) => r.date >= today && ACTIVE_RESERVATION.has(r.status),
      ),
    [reservations, today],
  );

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status === "active" || t.status === "pending"),
    [tasks],
  );

  const urgentTasks = openTasks.filter((t) => t.type === "urgent-confirm");
  const reminderTasks = openTasks.filter((t) => t.type === "reminder");

  const tableLabel = (tableId: string) =>
    activeBranch.tables.find((t) => t.id === tableId)?.label ?? tableId;

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
          {openTasks.length > 0 && (
            <StatusPill tone="amber">{openTasks.length} open</StatusPill>
          )}
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
                onDismiss={() =>
                  runAction(task.id, () => api.dismissReservationTask(task.id), "Task dismissed")
                }
              />
            ))}
            {reminderTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busyId === task.id}
                onDismiss={() =>
                  runAction(task.id, () => api.dismissReservationTask(task.id), "Task dismissed")
                }
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
                        {tableLabel(r.tableId)}
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
                          Pre-order:{" "}
                          {r.preOrder.map((i) => `${i.quantity}× ${i.name}`).join(", ")} (
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
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {r.status === "requested" && (
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() =>
                            runAction(
                              r.id,
                              () =>
                                api.confirmReservation(r.id, user?.id ?? "staff-mgr"),
                              "Reservation confirmed — table held",
                            )
                          }
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
                            runAction(r.id, () => api.seatReservation(r.id), "Guest seated")
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
                            runAction(r.id, () => api.completeReservation(r.id), "Completed")
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
                              runAction(r.id, () => api.markReservationNoShow(r.id), "Marked no-show")
                            }
                          >
                            No-show
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === r.id}
                            onClick={() =>
                              runAction(r.id, () => api.cancelReservation(r.id), "Cancelled")
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
