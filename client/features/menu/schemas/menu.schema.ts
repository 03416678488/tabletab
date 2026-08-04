import { z } from "zod";

const optionRowSchema = z.object({
  name: z.string(),
  price: z.number().min(0),
});

export const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Must be 0 or more"),
  images: z.array(z.string()),
  categoryId: z.string().optional(),
  isAvailable: z.boolean(),
  foodTypeIds: z.array(z.string()),
  menuIds: z.array(z.string()),
  sizes: z.array(optionRowSchema),
  variants: z.array(optionRowSchema),
  addOns: z.array(optionRowSchema),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;
