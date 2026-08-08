"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Icon shown in the animated badge (e.g. a bell or receipt). */
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  /** Dismiss button label. */
  actionLabel?: string;
}

/**
 * A clear, dismissible confirmation modal — a friendlier alternative to a
 * fleeting toast for guest-facing actions (call waiter, request bill) that are
 * easy to miss on a shared table phone. The icon springs in on open.
 */
export function SuccessDialog({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  actionLabel = "Got it",
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <div className="flex flex-col items-center gap-3 pt-1 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
            className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
          >
            <Icon className="size-8" />
          </motion.div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <Button className="mt-2 w-full" size="lg" onClick={() => onOpenChange(false)}>
            {actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
