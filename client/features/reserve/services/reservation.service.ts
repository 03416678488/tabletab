import { httpClient } from "@/lib/httpClient";
import type { Reservation, ReservationSource, ReservationStatus } from "@/lib/types";

interface ApiReservation {
  id: string;
  branchId: string | null;
  tableId: string | null;
  partySize: number;
  date: string;
  time: string;
  durationMins: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  specialRequests: string | null;
  status: string;
  source: string;
  createdAt: string;
  confirmedAt: string | null;
  seatedAt: string | null;
  completedAt: string | null;
  branch?: { name?: string } | null;
  table?: { name?: string } | null;
}

/** Storefront/manager reservation with the embedded branch/table display names. */
export interface StorefrontReservation extends Reservation {
  branchName?: string;
  tableName?: string;
}

function toReservation(r: ApiReservation): StorefrontReservation {
  return {
    id: r.id,
    branchId: r.branchId ?? "",
    tableId: r.tableId ?? "",
    partySize: r.partySize,
    date: r.date,
    time: r.time,
    durationMins: r.durationMins,
    guestName: r.guestName,
    guestPhone: r.guestPhone,
    guestEmail: r.guestEmail ?? undefined,
    specialRequests: r.specialRequests ?? undefined,
    status: r.status as ReservationStatus,
    source: (r.source as ReservationSource) ?? "online",
    createdAt: r.createdAt,
    confirmedAt: r.confirmedAt ?? undefined,
    seatedAt: r.seatedAt ?? undefined,
    completedAt: r.completedAt ?? undefined,
    branchName: r.branch?.name,
    tableName: r.table?.name,
  };
}

export interface BookReservationInput {
  branchId: string;
  tableId?: string;
  partySize: number;
  date: string;
  time: string;
  durationMins?: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  specialRequests?: string;
  source?: ReservationSource;
}

/** Public — book a table from the storefront (no account required). */
export async function bookReservation(input: BookReservationInput): Promise<StorefrontReservation> {
  const res = await httpClient.post<ApiReservation>("/reservations", input);
  return toReservation(res.data);
}

/** Public — the guest's confirmation page. */
export async function fetchReservation(id: string): Promise<StorefrontReservation | null> {
  try {
    const res = await httpClient.get<ApiReservation>(`/reservations/${id}`);
    return toReservation(res.data);
  } catch {
    return null;
  }
}

/** Staff — the manager reservation book. */
export async function listReservations(branchId?: string): Promise<StorefrontReservation[]> {
  const res = await httpClient.get<{ items?: ApiReservation[] } | ApiReservation[]>(
    "/reservations",
    { auth: true, params: { branchId, perPage: 200 } },
  );
  const items = Array.isArray(res.data) ? res.data : (res.data.items ?? []);
  return items.map(toReservation);
}

/** Staff — move a reservation through its lifecycle. */
export async function setReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<StorefrontReservation> {
  const res = await httpClient.put<ApiReservation>(`/reservations/${id}`, { status }, { auth: true });
  return toReservation(res.data);
}
