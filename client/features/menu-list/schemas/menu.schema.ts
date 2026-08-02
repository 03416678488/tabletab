import { z } from "zod";

export const menuSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean(),
});

export type MenuFormValues = z.infer<typeof menuSchema>;
