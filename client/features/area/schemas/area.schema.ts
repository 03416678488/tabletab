import { z } from "zod";

export const areaSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type AreaFormValues = z.infer<typeof areaSchema>;
