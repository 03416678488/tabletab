import { z } from "zod";

export const foodTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean(),
});

export type FoodTypeFormValues = z.infer<typeof foodTypeSchema>;
