import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(1, "Phone is required"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  isOpen: z.boolean(),
  // Converted from the text inputs via register({ setValueAs }); set by the map.
  lat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  lng: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  // Weekly hours object, or null to inherit the global opening times.
  openingHours: z.any().optional(),
  // Converted from the text input via register({ setValueAs }) in the form.
  deliveryFee: z.number().min(0, "Must be 0 or more").optional(),
  minOrder: z.number().min(0, "Must be 0 or more").optional(),
  deliveryEtaMinutes: z.number().min(0, "Must be 0 or more").optional(),
  onlineOrderingEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
