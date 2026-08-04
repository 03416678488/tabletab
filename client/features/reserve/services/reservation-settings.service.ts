import { httpClient } from "@/lib/httpClient";
import type { BranchReservationSettings } from "@/lib/types";

/**
 * Reservation settings now live as columns on the Branch, so they ride the
 * public `branches:<tenant>` realtime channel. Read is public (storefront needs
 * it); write is staff-only (`PUT /branches/:id`).
 */
interface ApiBranchReservation {
  id: string;
  reservationsEnabled?: boolean;
  reservationTurnMins?: number;
  reservationReminderLeadMins?: number;
  reservationNoShowGraceMins?: number;
  reservationBookingWindowDays?: number;
  reservationCutoffMins?: number;
}

export function toReservationSettings(b: ApiBranchReservation): BranchReservationSettings {
  return {
    branchId: b.id,
    enabled: b.reservationsEnabled ?? true,
    turnTimeMins: b.reservationTurnMins ?? 90,
    reminderLeadMins: b.reservationReminderLeadMins ?? 30,
    noShowGraceMins: b.reservationNoShowGraceMins ?? 15,
    bookingWindowDays: b.reservationBookingWindowDays ?? 14,
    cutoffMins: b.reservationCutoffMins ?? 60,
  };
}

export async function fetchReservationSettings(
  branchId: string,
): Promise<BranchReservationSettings> {
  const res = await httpClient.get<ApiBranchReservation>(`/branches/${branchId}`);
  return toReservationSettings(res.data);
}

export async function saveReservationSettings(
  branchId: string,
  patch: Partial<Omit<BranchReservationSettings, "branchId">>,
): Promise<BranchReservationSettings> {
  // Map the storefront-facing setting names onto the branch columns.
  const body: Record<string, unknown> = {};
  if (patch.enabled !== undefined) body.reservationsEnabled = patch.enabled;
  if (patch.turnTimeMins !== undefined) body.reservationTurnMins = patch.turnTimeMins;
  if (patch.reminderLeadMins !== undefined) body.reservationReminderLeadMins = patch.reminderLeadMins;
  if (patch.noShowGraceMins !== undefined) body.reservationNoShowGraceMins = patch.noShowGraceMins;
  if (patch.bookingWindowDays !== undefined) {
    body.reservationBookingWindowDays = patch.bookingWindowDays;
  }
  if (patch.cutoffMins !== undefined) body.reservationCutoffMins = patch.cutoffMins;

  const res = await httpClient.put<ApiBranchReservation>(`/branches/${branchId}`, body, {
    auth: true,
  });
  return toReservationSettings(res.data);
}
