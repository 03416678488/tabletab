export interface TimeSlot {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
}

export interface TimeSlotInput {
  day: string;
  startTime: string;
  endTime: string;
}

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
