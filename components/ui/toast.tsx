"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type ToastTone } from "@/hooks/use-toast";

export { toast } from "@/hooks/use-toast";

const TONE_META: Record<ToastTone, { icon: React.ElementType; className: string }> = {
  default: { icon: Info, className: "text-brand-deep" },
  success: { icon: CheckCircle2, className: "text-emerald-600" },
  error: { icon: TriangleAlert, className: "text-red-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function ToastItem({ id, title, description, tone, duration }: {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
}) {
  const dismiss = useToastStore((s) => s.dismiss);
  const meta = TONE_META[tone];
  const Icon = meta.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => dismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-elevated)]"
      role="status"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", meta.className)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={() => dismiss(id)}
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export { Toaster };
