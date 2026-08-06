"use client";

import { AlertTriangle, Clock, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { CreateOrderInput } from "@/features/order/types/order.types";
import type { QueuedOrder } from "@/features/offline/lib/offline-store";

function orderTotal(p: CreateOrderInput): number {
  const subtotal = (p.items ?? []).reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  return subtotal - (p.discount ?? 0) + (p.tax ?? 0);
}

function timeLabel(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function QueuedOrdersDialog({
  open,
  onClose,
  queue,
  online,
  syncing,
  onSync,
  onRetry,
  onDiscard,
}: {
  open: boolean;
  onClose: () => void;
  queue: QueuedOrder[];
  online: boolean;
  syncing: boolean;
  onSync: () => void;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
}) {
  const confirm = useConfirm();
  const pending = queue.filter((o) => o.status === "pending").length;

  const discard = async (o: QueuedOrder) => {
    const ok = await confirm({
      title: `Discard order ${o.localId}?`,
      description: "This offline order will be deleted and never sent.",
      confirmLabel: "Discard",
    });
    if (ok) onDiscard(o.localId);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Queued orders</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {pending > 0 ? `${pending} waiting to sync` : "Nothing waiting"}
            {online ? "" : " · offline"}
          </span>
          {pending > 0 && (
            <Button variant="outline" size="sm" onClick={onSync} disabled={syncing || !online}>
              <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          )}
        </div>

        <div className="mt-2 max-h-[24rem] overflow-y-auto">
          {queue.length === 0 ? (
            <EmptyState className="py-10" icon={Clock} title="No queued orders" description="Offline orders show up here until they sync." />
          ) : (
            <ul className="divide-y divide-border">
              {queue.map((o) => {
                const failed = o.status === "failed";
                return (
                  <li key={o.localId} className="flex items-start gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-ink">{o.localId}</span>
                        {failed ? (
                          <StatusPill tone="red">Failed</StatusPill>
                        ) : (
                          <StatusPill tone="amber">Pending</StatusPill>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {(o.payload.items ?? []).length} item
                        {(o.payload.items ?? []).length === 1 ? "" : "s"} ·{" "}
                        {formatMoney(orderTotal(o.payload))} · {timeLabel(o.createdAt)}
                      </span>
                      {failed && o.error && (
                        <span className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="size-3" /> {o.error}
                        </span>
                      )}
                    </span>
                    {failed && (
                      <div className="flex shrink-0 gap-1">
                        <Button variant="outline" size="sm" onClick={() => onRetry(o.localId)}>
                          <RefreshCw className="size-4" /> Retry
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Discard"
                          onClick={() => void discard(o)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
