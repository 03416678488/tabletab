import { z } from "zod";

export const tableSchema = z.object({
  name: z.string().min(1, "Name is required"),
  areaId: z.string().optional(),
  capacity: z.number().int().min(1, "At least 1 seat"),
  branchId: z.string().optional(),
  isActive: z.boolean(),
});

export type TableFormValues = z.infer<typeof tableSchema>;
