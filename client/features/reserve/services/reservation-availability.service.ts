import { httpClient } from "@/lib/httpClient";
import type { Table } from "@/lib/types";

interface ApiTable {
  id: string;
  name: string;
  capacity: number;
  branchId: string | null;
  isActive: boolean;
}

/**
 * Tables free for a party at a branch on a given date/time slot (public). The
 * backend excludes tables already held by an overlapping reservation and filters
 * to those seating the party.
 */
export async function fetchAvailableTables(params: {
  branchId: string;
  partySize: number;
  date: string;
  time: string;
  durationMins?: number;
}): Promise<Table[]> {
  const res = await httpClient.get<ApiTable[]>("/reservations/availability", {
    params: {
      branchId: params.branchId,
      partySize: params.partySize,
      date: params.date,
      time: params.time,
      ...(params.durationMins ? { durationMins: params.durationMins } : {}),
    },
  });
  return (res.data ?? []).map((t) => ({
    id: t.id,
    branchId: t.branchId ?? "",
    label: t.name,
    seats: t.capacity,
    qrToken: "",
    status: "available" as Table["status"],
  }));
}
