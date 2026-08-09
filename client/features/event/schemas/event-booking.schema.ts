import { z } from "zod";

/** Staff-side manual booking. Event type / branch optional; source selectable. */
export const eventBookingSchema = z.object({
  eventTypeId: z.string().optional(),
  branchId: z.string().optional(),
  title: z.string().min(1, "Give the event a title"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .or(z.literal(""))
    .optional(),
  guestCount: z.string().regex(/^\d+$/, "Enter the number of guests"),
  guestName: z.string().min(1, "Guest name is required"),
  guestPhone: z.string().min(6, "A contact number is required"),
  guestEmail: z.string().email("Enter a valid email").or(z.literal("")).optional(),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .or(z.literal(""))
    .optional(),
  specialRequests: z.string().optional(),
  source: z.enum(["online", "phone", "walk-in"]),
});

export type EventBookingFormValues = z.infer<typeof eventBookingSchema>;
