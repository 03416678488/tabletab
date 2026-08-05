import { z } from "zod";

export const staffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email"),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "chef", "waiter", "delivery"]),
  branchId: z.string().optional(),
  avatarUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  isActive: z.boolean(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
