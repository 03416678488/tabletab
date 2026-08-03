import { z } from "zod";
import { SLUG_RULE } from "@/features/tenants/schemas/tenant";

export const signupSchema = z.object({
  restaurantName: z.string().trim().min(1, "Restaurant name is required"),
  handle: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(40)
    .regex(SLUG_RULE, "Lowercase letters, numbers, and hyphens only"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(128),
  // Optional so the form's input/output types match — backend defaults to "trial".
  plan: z.string().optional(),
});

export type SignupForm = z.infer<typeof signupSchema>;

/** Static tier list — the public form can't hit the auth-gated /plans catalog. */
export const SIGNUP_PLANS = [
  { value: "trial", label: "Trial", sublabel: "Free" },
  { value: "starter", label: "Starter", sublabel: "$29/mo" },
  { value: "pro", label: "Pro", sublabel: "$79/mo" },
  { value: "enterprise", label: "Enterprise", sublabel: "Custom" },
];
