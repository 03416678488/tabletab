import { z } from "zod";

export const eventInquirySchema = z.object({
  eventTypeId: z.string().min(1, "Choose an event type"),
  branchId: z.string().min(1, "Choose a location"),
  title: z.string().min(1, "Give your event a title"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .or(z.literal(""))
    .optional(),
  guestCount: z.string().regex(/^\d+$/, "Enter the number of guests"),
  guestName: z.string().min(1, "Your name is required"),
  guestPhone: z.string().min(6, "A contact number is required"),
  guestEmail: z.string().min(1, "Email is required").email("Enter a valid email"),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .or(z.literal(""))
    .optional(),
  specialRequests: z.string().optional(),
});

export type EventInquiryFormValues = z.infer<typeof eventInquirySchema>;
