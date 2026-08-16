import { z } from "zod";

const optionalNonNeg = z.number().min(0, "Must be 0 or more").optional();
const optionalPositiveInt = z.number().int().min(1, "Must be at least 1").optional();

export const promotionSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens")
      .or(z.literal(""))
      .optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(0, "Must be 0 or more"),
    code: z.string().optional(),
    minOrderAmount: optionalNonNeg,
    maxDiscountAmount: optionalNonNeg,
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    active: z.boolean(),
    usageLimit: optionalPositiveInt,
    perCustomerLimit: optionalPositiveInt,
    productIds: z.array(z.string()),
  })
  .refine((v) => v.discountType !== "percentage" || v.discountValue <= 100, {
    message: "A percentage can't exceed 100",
    path: ["discountValue"],
  });

export type PromotionFormValues = z.infer<typeof promotionSchema>;
