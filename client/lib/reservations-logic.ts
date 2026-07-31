/**
 * Reservation business logic used by lib/api.ts (single swap point).
 */
import { getReservationsSnapshot } from "@/hooks/use-reservations-store";
import { getSettingsSnapshot } from "@/hooks/use-settings-store";
import {
  computeFireAt,
  formatSlotLabel,
  getAvailableTables,
  isTableAvailableForSlot,
  minutesUntilSlot,
  slotEndDate,
} from "@/lib/reservation-utils";
import type {
  Branch,
  CreateReservationInput,
  Order,
  Reservation,
  ReservationTask,
  ReservationTaskStatus,
  Table,
} from "@/lib/types";

let reservationCounter = 100;
let taskCounter = 100;

function newReservationId() {
  reservationCounter += 1;
  return `res-${reservationCounter}`;
}

function newTaskId() {
  taskCounter += 1;
  return `rtask-${taskCounter}`;
}

export function listReservations(branchId?: string): Reservation[] {
  const { reservations } = getReservationsSnapshot();
  const list = branchId ? reservations.filter((r) => r.branchId === branchId) : reservations;
  return [...list].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
  );
}

export function listReservationTasks(branchId?: string): ReservationTask[] {
  const { tasks } = getReservationsSnapshot();
  const list = branchId ? tasks.filter((t) => t.branchId === branchId) : tasks;
  return [...list].sort(
    (a, b) => new Date(a.activatesAt).getTime() - new Date(b.activatesAt).getTime(),
  );
}

export function getReservation(id: string): Reservation | undefined {
  return getReservationsSnapshot().reservations.find((r) => r.id === id);
}

export function availableTablesForBooking(
  branch: Branch,
  partySize: number,
  date: string,
  time: string,
): Table[] {
  const settings = getSettingsSnapshot().getReservationSettings(branch.id);
  return getAvailableTables(
    branch,
    partySize,
    date,
    time,
    settings.turnTimeMins,
    listReservations(branch.id),
  );
}

export function createReservationRecord(input: CreateReservationInput): Reservation {
  const settings = getSettingsSnapshot().getReservationSettings(input.branchId);
  const branch = getSettingsSnapshot().getBranch(input.branchId);
  if (!branch) throw new Error("Branch not found");
  if (!settings.enabled) throw new Error("Reservations disabled for this branch");

  const available = isTableAvailableForSlot(
    branch.tables.find((t) => t.id === input.tableId)!,
    input.partySize,
    input.date,
    input.time,
    settings.turnTimeMins,
    listReservations(input.branchId),
  );
  if (!available) throw new Error("Table no longer available");

  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: newReservationId(),
    branchId: input.branchId,
    tableId: input.tableId,
    partySize: input.partySize,
    date: input.date,
    time: input.time,
    durationMins: settings.turnTimeMins,
    guestName: input.guestName.trim(),
    guestPhone: input.guestPhone.trim(),
    guestEmail: input.guestEmail?.trim() || undefined,
    specialRequests: input.specialRequests?.trim() || undefined,
    preOrder: input.preOrder?.length ? input.preOrder : undefined,
    buffet: input.buffet,
    status: "requested",
    source: "online",
    createdAt: now,
  };

  getReservationsSnapshot().upsertReservation(reservation);

  const minsUntil = minutesUntilSlot(input.date, input.time);
  const slotLabel = formatSlotLabel(input.date, input.time);

  if (minsUntil > settings.reminderLeadMins) {
    const activatesAt = new Date(
      slotStartMs(input.date, input.time) - settings.reminderLeadMins * 60_000,
    ).toISOString();
    getReservationsSnapshot().upsertTask({
      id: newTaskId(),
      reservationId: reservation.id,
      branchId: input.branchId,
      type: "reminder",
      status: "pending",
      activatesAt,
      createdAt: now,
      message: `Reminder: confirm reservation for ${reservation.guestName}`,
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      slotLabel,
    });
  } else {
    getReservationsSnapshot().upsertTask({
      id: newTaskId(),
      reservationId: reservation.id,
      branchId: input.branchId,
      type: "urgent-confirm",
      status: "active",
      activatesAt: now,
      createdAt: now,
      message: "URGENT: Call guest to confirm — booking is soon",
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      slotLabel,
    });
  }

  return reservation;
}

function slotStartMs(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime();
}

export function patchReservation(id: string, patch: Partial<Reservation>): Reservation | undefined {
  const existing = getReservation(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  getReservationsSnapshot().upsertReservation(updated);
  return updated;
}

export function dismissReservationTask(taskId: string): ReservationTask | undefined {
  const task = listReservationTasks().find((t) => t.id === taskId);
  if (!task) return undefined;
  const updated = { ...task, status: "done" as ReservationTaskStatus };
  getReservationsSnapshot().upsertTask(updated);
  return updated;
}

export function tickReservationTimers(): void {
  const now = Date.now();
  const settingsStore = getSettingsSnapshot();

  for (const task of listReservationTasks()) {
    if (task.status !== "pending") continue;
    if (new Date(task.activatesAt).getTime() <= now) {
      getReservationsSnapshot().upsertTask({ ...task, status: "active" });
    }
  }

  for (const r of listReservations()) {
    if (r.status !== "confirmed") continue;
    const settings = settingsStore.getReservationSettings(r.branchId);
    const graceEnd = slotEndDate(r.date, r.time, r.durationMins).getTime();
    const noShowAt = graceEnd + settings.noShowGraceMins * 60_000;
    if (now >= noShowAt && !r.seatedAt) {
      patchReservation(r.id, { status: "no-show", completedAt: new Date().toISOString() });
      for (const t of listReservationTasks().filter((x) => x.reservationId === r.id)) {
        if (t.status !== "done") {
          getReservationsSnapshot().upsertTask({ ...t, status: "done" });
        }
      }
    }
  }
}

export function createPreOrderForReservation(
  reservation: Reservation,
  createOrder: (order: Order) => void,
): Reservation {
  if (!reservation.preOrder?.length && !reservation.buffet) return reservation;

  const itemsSubtotal = reservation.preOrder?.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  ) ?? 0;
  const buffetSubtotal = reservation.buffet?.subtotal ?? 0;
  const subtotal = itemsSubtotal + buffetSubtotal;
  const fireAt = computeFireAt(reservation.date, reservation.time, 15);

  const order: Order = {
    id: `ord-res-${reservation.id}`,
    reference: `RSV-${reservation.id.slice(-4).toUpperCase()}`,
    channel: "online",
    fulfillmentType: "dine-in",
    branchId: reservation.branchId,
    tableId: reservation.tableId,
    status: "placed",
    items: reservation.preOrder ?? [],
    buffet: reservation.buffet,
    customerName: reservation.guestName,
    subtotal,
    total: subtotal,
    placedAt: new Date().toISOString(),
    fireAt,
    reservationId: reservation.id,
  };

  createOrder(order);
  return patchReservation(reservation.id, { preOrderId: order.id, fireAt }) ?? reservation;
}

export function reservationStatsForToday(branchId?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const list = listReservations(branchId).filter((r) => r.date === today);
  const covers = list
    .filter((r) => !["cancelled", "no-show"].includes(r.status))
    .reduce((s, r) => s + r.partySize, 0);
  const noShows = list.filter((r) => r.status === "no-show").length;
  return { covers, noShows, count: list.length };
}
