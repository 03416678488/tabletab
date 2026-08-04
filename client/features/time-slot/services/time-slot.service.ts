import { httpClient } from "@/lib/httpClient";
import type {
  TimeSlot,
  TimeSlotInput,
} from "@/features/time-slot/types/time-slot.types";

export const timeSlotService = {
  list() {
    return httpClient.get<TimeSlot[]>("/time-slots").then((r) => r.data);
  },
  create(body: TimeSlotInput) {
    return httpClient
      .post<TimeSlot>("/time-slots", body, { auth: true })
      .then((r) => r.data);
  },
  remove(id: number) {
    return httpClient
      .delete<{ message: string }>(`/time-slots/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
