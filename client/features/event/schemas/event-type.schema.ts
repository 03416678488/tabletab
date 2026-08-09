import { z } from "zod";

export const eventTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  basePrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .or(z.literal(""))
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean(),
});

export type EventTypeFormValues = z.infer<typeof eventTypeSchema>;
