import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn Badge — small status/label pill. Tones are wired to the app's tokens
 * (brand primary, subtle secondary, destructive, success). For the richer
 * status system with dot + reservation/order tones, see `StatusPill`.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-primary-foreground",
        secondary: "border-transparent bg-secondary text-ink",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-700",
        outline: "border-border text-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
