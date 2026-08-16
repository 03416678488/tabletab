import { z } from "zod";

/** `isEdit` relaxes the password rule — on edit, blank means "keep current". */
export function userSchema(isEdit: boolean) {
  return z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Enter a valid email"),
    phoneNumber: z.string().trim().min(5, "Enter a valid phone number"),
    password: isEdit
      ? z.string().max(200).optional().or(z.literal(""))
      : z.string().min(6, "Password must be at least 6 characters"),
    branchId: z.string().optional().or(z.literal("")),
    isActive: z.boolean(),
  });
}

export type UserFormValues = z.infer<ReturnType<typeof userSchema>>;
