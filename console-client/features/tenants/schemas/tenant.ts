import { z } from "zod";

export const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Handle is required")
    .regex(SLUG_RULE, "Lowercase letters, numbers, and hyphens only"),
  // Optional (not .default) so the form's input and output types match — the
  // backend fills in "trial" when omitted.
  plan: z.string().optional(),
});

export type CreateTenantForm = z.infer<typeof createTenantSchema>;

/** Turn a display name into a URL-safe handle, e.g. "Acme Bistro" → "acme-bistro". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
