import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(1, "Phone is required"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  isOpen: z.boolean(),
  openingHours: z.string().optional(),
  // Converted from the text input via register({ setValueAs }) in the form.
  deliveryFee: z.number().min(0, "Must be 0 or more").optional(),
  minOrder: z.number().min(0, "Must be 0 or more").optional(),
  onlineOrderingEnabled: z.boolean(),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
