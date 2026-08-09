"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Check,
  Copy,
  Download,
  Pencil,
  Plus,
  Printer,
  QrCode as QrCodeIcon,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useQrCodes } from "@/features/qr-code/hooks/use-qr-codes";
import { qrCodeService } from "@/features/qr-code/services/qr-code.service";
import { scanUrlForSlug } from "@/features/qr-code/constants/qr-code.constants";
import { QrCodeFormDialog } from "@/features/qr-code/components/qr-code-form-dialog";
import type { QrCode } from "@/features/qr-code/types/qr-code.types";

const ALL = "__all__";

export function QrCodeManager() {
  const { qrCodes, loading, error, refetch } = useQrCodes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QrCode | null>(null);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState<string>(ALL);

  const usedTableIds = useMemo(() => qrCodes.map((q) => q.tableId), [qrCodes]);

  const areaTabs = useMemo(() => {
    const names = new Set<string>();
    for (const q of qrCodes) {
      names.add(q.table?.area?.name ?? "No area");
    }
    return Array.from(names).sort();
  }, [qrCodes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return qrCodes.filter((qr) => {
      const areaName = qr.table?.area?.name ?? "No area";
      if (area !== ALL && areaName !== area) return false;
      if (q && !`${qr.table?.name ?? ""} ${areaName} ${qr.slug}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [qrCodes, search, area]);

  // Client-side pagination (the full list is required for the area tabs and the
  // "already-used table" guard, so we page over the filtered result locally).
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  useEffect(() => setPage(1), [search, area, perPage]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (qr: QrCode) => {
    setEditing(qr);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (qr: QrCode) => {
    const ok = await confirm({
      title: `Delete the QR code for "${qr.table?.name ?? "this table"}"?`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await qrCodeService.remove(qr.id);
      toast("QR code deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete QR code", {
        tone: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">QR Codes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {qrCodes.length} code{qrCodes.length === 1 ? "" : "s"} · one scannable code per table.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add QR code
        </Button>
      </div>

      <div className="mt-5">
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by table or area…"
            className="h-9 pl-9"
            aria-label="Search QR codes"
          />
        </div>
      </div>

      {areaTabs.length > 0 && (
        <SegmentedTabs
          className="mt-4"
          aria-label="Filter by area"
          value={area}
          onChange={setArea}
          tabs={[
            { key: ALL, label: "All Areas" },
            ...areaTabs.map((name) => ({ key: name, label: name })),
          ]}
        />
      )}

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-0">
            <EmptyState
              className="py-12"
              icon={QrCodeIcon}
              title="Couldn't load QR codes"
              description={error}
              action={
                <Button variant="outline" onClick={refetch}>
                  Retry
                </Button>
              }
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              className="py-12"
              icon={QrCodeIcon}
              title={qrCodes.length === 0 ? "No QR codes yet" : "No matches"}
              description={
                qrCodes.length === 0
                  ? "Generate a QR code for a table so guests can scan to order."
                  : "Try a different search or area."
              }
              action={
                qrCodes.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Plus className="size-4" /> Add QR code
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {pageItems.map((qr) => (
                <QrCard
                  key={qr.id}
                  qr={qr}
                  onEdit={() => openEdit(qr)}
                  onDelete={() => remove(qr)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={setPerPage}
              perPageOptions={[12, 24, 48, 96]}
              className="mt-4"
            />
          </>
        )}
      </div>

      <QrCodeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        qrCode={editing}
        usedTableIds={usedTableIds}
        onSaved={refetch}
      />
    </div>
  );
}

function QrCard({
  qr,
  onEdit,
  onDelete,
}: {
  qr: QrCode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const url = scanUrlForSlug(qr.slug);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const safe = (qr.table?.name ?? qr.slug).replace(/\s+/g, "-").toLowerCase();
    link.download = `qr-${safe}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied", { tone: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy link", { tone: "error" });
    }
  };

  /** Open a print-ready page (QR + table info) and trigger the print dialog. */
  const print = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=460,height=680");
    if (!win) {
      toast("Allow pop-ups to print", { tone: "error" });
      return;
    }
    const esc = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
    const tableName = esc(qr.table?.name ?? "");
    const sub = esc([qr.table?.area?.name, qr.table?.branch?.name].filter(Boolean).join(" · "));
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>QR ${tableName}</title>` +
        `<style>*{margin:0;box-sizing:border-box}` +
        `body{font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:32px;text-align:center;color:#111}` +
        `img{width:300px;height:300px}h1{font-size:30px;margin-top:20px}` +
        `p{color:#666;margin-top:6px;font-size:15px}.hint{margin-top:14px;font-size:13px;color:#999}` +
        `@media print{@page{margin:12mm}}</style></head><body>` +
        `<img src="${dataUrl}" alt="QR code"/>` +
        `<h1>${tableName}</h1>${sub ? `<p>${sub}</p>` : ""}` +
        `<p class="hint">Scan to view the menu &amp; order</p>` +
        `<script>window.onload=function(){window.focus();window.print();};</script>` +
        `</body></html>`,
    );
    win.document.close();
  };

  return (
    <Card className="flex flex-col items-center gap-3 p-4 text-center">
      <div className="flex w-full items-center justify-between">
        <StatusPill tone={qr.isActive ? "green" : "neutral"}>
          {qr.isActive ? "Active" : "Inactive"}
        </StatusPill>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" aria-label="Print" onClick={print}>
            <Printer className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Edit" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border bg-white p-3",
          !qr.isActive && "opacity-50",
        )}
      >
        <QRCodeCanvas value={url} size={132} level="M" marginSize={2} ref={canvasRef} />
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{qr.table?.name ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {qr.table?.area?.name ?? "No area"}
          {qr.table?.branch?.name ? ` · ${qr.table.branch.name}` : ""}
        </p>
      </div>

      <div className="flex w-full gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Link"}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={download}>
          <Download className="size-4" /> PNG
        </Button>
      </div>
    </Card>
  );
}
