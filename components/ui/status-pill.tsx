import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-slate-200 bg-slate-50 text-slate-600",
        brand: "border-brand/20 bg-brand-tint text-brand-deep",
        amber: "border-amber-200 bg-accent-tint text-amber-700",
        blue: "border-sky-200 bg-sky-50 text-sky-700",
        green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        red: "border-red-200 bg-red-50 text-red-700",
        purple: "border-violet-200 bg-violet-50 text-violet-700",
      },
      dark: {
        true: "border-transparent",
        false: "",
      },
    },
    defaultVariants: { tone: "neutral", dark: false },
  },
);

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {
  /** Show a leading status dot. */
  dot?: boolean;
}

function StatusPill({ className, tone, dark, dot = true, children, ...props }: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ tone, dark }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  );
}

type Tone = NonNullable<StatusPillProps["tone"]>;

const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  placed: { label: "Placed", tone: "amber" },
  accepted: { label: "Accepted", tone: "blue" },
  preparing: { label: "Preparing", tone: "purple" },
  ready: { label: "Ready", tone: "brand" },
  "out-for-delivery": { label: "Out for delivery", tone: "blue" },
  served: { label: "Served", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

function OrderStatusPill({
  status,
  ...props
}: { status: OrderStatus } & Omit<StatusPillProps, "tone" | "children">) {
  const meta = ORDER_STATUS_META[status];
  return (
    <StatusPill tone={meta.tone} {...props}>
      {meta.label}
    </StatusPill>
  );
}

const RESERVATION_STATUS_META: Record<
  import("@/lib/types").ReservationStatus,
  { label: string; tone: Tone }
> = {
  requested: { label: "Requested", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "blue" },
  seated: { label: "Seated", tone: "brand" },
  completed: { label: "Completed", tone: "green" },
  "no-show": { label: "No-show", tone: "red" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function ReservationStatusPill({
  status,
  ...props
}: { status: import("@/lib/types").ReservationStatus } & Omit<
  StatusPillProps,
  "tone" | "children"
>) {
  const meta = RESERVATION_STATUS_META[status];
  return (
    <StatusPill tone={meta.tone} {...props}>
      {meta.label}
    </StatusPill>
  );
}

export { StatusPill, OrderStatusPill, ReservationStatusPill, statusPillVariants, ORDER_STATUS_META };
