"use client";

import { useState } from "react";
import { Bell, Droplets, Receipt, ShieldAlert, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useVenueStore } from "@/hooks/use-venue-store";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { ServiceRequestType } from "@/lib/types";

const ACTIONS: {
  type: ServiceRequestType;
  label: string;
  description: string;
  icon: typeof Bell;
}[] = [
  { type: "waiter", label: "Call waiter", description: "Someone will be right over", icon: UserRound },
  { type: "water", label: "Need water", description: "Refill or extra glasses", icon: Droplets },
  { type: "bill", label: "Request bill", description: "Ready to pay", icon: Receipt },
  { type: "manager", label: "Need help", description: "Speak with a manager", icon: ShieldAlert },
];

export function CallWaiterFab() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const branchId = useVenueStore((s) => s.branchId);
  const tableId = useVenueStore((s) => s.tableId);
  const tableLabel = useVenueStore((s) => s.tableLabel);

  const handleAction = async (type: ServiceRequestType, label: string) => {
    if (!branchId || !tableId || !tableLabel) return;
    setSending(true);
    try {
      await api.placeVenueServiceRequest(branchId, tableId, tableLabel, type);
      toast(`${label} — we're on our way!`, { tone: "success", duration: 5000 });
      setOpen(false);
    } catch {
      toast("Could not send request", { tone: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform active:scale-95 hover:bg-brand-hover"
        aria-label="Call waiter or need help"
      >
        <Bell className="size-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>How can we help?</SheetTitle>
            <p className="text-sm text-muted-foreground">Table {tableLabel}</p>
          </SheetHeader>
          <div className="grid gap-2 px-6 pb-8">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.type}
                  variant="outline"
                  className="h-auto justify-start gap-3 px-4 py-3"
                  disabled={sending}
                  onClick={() => handleAction(action.type, action.label)}
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-left">
                    <span className="block font-medium">{action.label}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
