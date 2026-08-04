import { z } from "zod";

export const qrCodeSchema = z.object({
  tableId: z.string().min(1, "Select a table"),
  isActive: z.boolean(),
});

export type QrCodeFormValues = z.infer<typeof qrCodeSchema>;
