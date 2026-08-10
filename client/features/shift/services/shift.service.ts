import { httpClient } from "@/lib/httpClient";
import type { Shift } from "@/features/shift/types/shift.types";

export const shiftService = {
  /** The caller's current open shift, or null when off duty. */
  current() {
    return httpClient.get<Shift | null>("/shifts/current", { auth: true }).then((r) => r.data);
  },

  history() {
    return httpClient.get<Shift[]>("/shifts/history", { auth: true }).then((r) => r.data);
  },

  clockIn(body: { note?: string } = {}) {
    return httpClient.post<Shift>("/shifts/clock-in", body, { auth: true }).then((r) => r.data);
  },

  clockOut() {
    return httpClient.post<Shift>("/shifts/clock-out", {}, { auth: true }).then((r) => r.data);
  },
};
