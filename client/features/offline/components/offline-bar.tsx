"use client";

import { AlertTriangle, CloudOff, ListChecks, RefreshCw, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** POS status bar: offline mode + pending/failed offline-order sync. */
export function OfflineBar({
  online,
  pending,
  failed,
  syncing,
  onSync,
  onReview,
}: {
  online: boolean;
  pending: number;
  failed: number;
  syncing: boolean;
  onSync: () => void;
  onReview: () => void;
}) {
  const hasQueued = pending + failed > 0;
  if (online && !hasQueued) return null;

  const danger = !online || failed > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
        danger
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      {!online ? (
        <CloudOff className="size-4 shrink-0" />
      ) : failed > 0 ? (
        <AlertTriangle className="size-4 shrink-0" />
      ) : (
        <UploadCloud className="size-4 shrink-0" />
      )}
      <span className="font-medium">
        {!online
          ? pending > 0
            ? `Offline — ${pending} order${pending === 1 ? "" : "s"} saved on this device, will sync automatically`
            : "Offline — orders are saved on this device and sync when the connection returns"
          : failed > 0
            ? `${failed} order${failed === 1 ? "" : "s"} failed to sync — review needed`
            : `Back online — syncing ${pending} offline order${pending === 1 ? "" : "s"}`}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {hasQueued && (
          <Button variant="outline" size="sm" onClick={onReview}>
            <ListChecks className="size-4" /> Review ({pending + failed})
          </Button>
        )}
        {pending > 0 && (
          <Button variant="outline" size="sm" onClick={onSync} disabled={syncing || !online}>
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
        )}
      </div>
    </div>
  );
}
