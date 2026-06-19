import type { Reservation, ReservationTask } from "@/lib/types";
import { formatSlotLabel } from "@/lib/reservation-utils";

function daysFromNow(days: number, hour: number, minute: number): { date: string; time: string } {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

const t1 = daysFromNow(0, 18, 30);
const t2 = daysFromNow(1, 19, 0);
const t3 = daysFromNow(0, 12, 0);

export const seedReservations: Reservation[] = [
  {
    id: "res-1",
    branchId: "br-riverside",
    tableId: "br-riverside-t4",
    partySize: 4,
    date: t1.date,
    time: t1.time,
    durationMins: 90,
    guestName: "Alex Morgan",
    guestPhone: "+1 555-0142",
    guestEmail: "alex@example.com",
    specialRequests: "Window seat if possible",
    status: "requested",
    source: "online",
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    id: "res-2",
    branchId: "br-riverside",
    tableId: "br-riverside-t2",
    partySize: 2,
    date: t2.date,
    time: t2.time,
    durationMins: 90,
    guestName: "Jamie Lee",
    guestPhone: "+1 555-0198",
    status: "confirmed",
    source: "online",
    createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    confirmedAt: new Date(Date.now() - 23 * 60 * 60_000).toISOString(),
    confirmedBy: "staff-owner",
    preOrder: [
      {
        menuItemId: "itm-margherita",
        name: "Margherita",
        quantity: 1,
        unitPrice: 15,
        modifiers: [],
      },
    ],
    fireAt: new Date(
      new Date(`${t2.date}T${t2.time}:00`).getTime() - 15 * 60_000,
    ).toISOString(),
  },
  {
    id: "res-3",
    branchId: "br-riverside",
    tableId: "br-riverside-p2",
    partySize: 6,
    date: t3.date,
    time: t3.time,
    durationMins: 90,
    guestName: "Taylor Brooks",
    guestPhone: "+1 555-0177",
    status: "confirmed",
    source: "phone",
    createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    confirmedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    confirmedBy: "staff-mgr",
  },
];

export const seedReservationTasks: ReservationTask[] = [
  {
    id: "rtask-1",
    reservationId: "res-1",
    branchId: "br-riverside",
    type: "urgent-confirm",
    status: "active",
    activatesAt: new Date(Date.now() - 60_000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    message: "Call guest to confirm — booking is less than 30 min before arrival",
    guestName: "Alex Morgan",
    guestPhone: "+1 555-0142",
    slotLabel: formatSlotLabel(t1.date, t1.time),
  },
];
