"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Check,
  Copy,
  Download,
  Link as LinkIcon,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  Printer,
  QrCode as QrCodeIcon,
  Search,
  Star,
  Trash2,
  Type as TypeIcon,
  Utensils,
  Wifi,
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
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { qrCodeService } from "@/features/qr-code/services/qr-code.service";
import { qrEncodedValue } from "@/features/qr-code/constants/qr-code.constants";
import { QrCodeFormDialog } from "@/features/qr-code/components/qr-code-form-dialog";
import type { QrCode, QrCustomType } from "@/features/qr-code/types/qr-code.types";

const ALL = "__all__";

const CUSTOM_TYPE_META: Record<QrCustomType, { label: string; icon: typeof LinkIcon }> = {
  url: { label: "Link", icon: LinkIcon },
  review: { label: "Google Review", icon: Star },
  wifi: { label: "WiFi", icon: Wifi },
  text: { label: "Text", icon: TypeIcon },
  phone: { label: "Phone", icon: Phone },
  email: { label: "Email", icon: Mail },
};

export function QrCodeManager() {
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const { qrCodes, loading, error, refetch } = useQrCodes(branchId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QrCode | null>(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<string>(ALL);

  const tableCount = useMemo(() => qrCodes.filter((q) => q.kind === "table").length, [qrCodes]);
  const customCount = useMemo(() => qrCodes.filter((q) => q.kind === "custom").length, [qrCodes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return qrCodes.filter((qr) => {
      if (kind !== ALL && qr.kind !== kind) return false;
      if (!q) return true;
      const haystack =
        qr.kind === "table"
          ? `${qr.table?.name ?? ""} ${qr.table?.area?.name ?? ""} ${qr.slug}`
          : `${qr.label ?? ""} ${qr.customType ?? ""} ${qr.content ?? ""}`;
      return haystack.toLowerCase().includes(q);
    });
  }, [qrCodes, search, kind]);

  // Client-side pagination — the full list is small and drives the tab counts.
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  useEffect(() => setPage(1), [search, kind, perPage]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  const openCreate = () => {
    if (!branchId) {
      toast("Select a branch first to add a custom QR code", { tone: "info" });
      return;
    }
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
      title: `Delete "${qr.label ?? "this QR code"}"?`,
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

  const toggleActive = async (qr: QrCode) => {
    try {
      await qrCodeService.update(qr.id, { isActive: !qr.isActive });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't update QR code", {
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
            {tableCount} table code{tableCount === 1 ? "" : "s"} auto-generated · {customCount}{" "}
            custom
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add QR code
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search codes…"
            className="h-9 pl-9"
            aria-label="Search QR codes"
          />
        </div>
        <SegmentedTabs
          aria-label="Filter by kind"
          value={kind}
          onChange={setKind}
          tabs={[
            { key: ALL, label: "All" },
            { key: "table", label: "Tables" },
            { key: "custom", label: "Custom" },
          ]}
        />
      </div>

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
                  ? "Add tables to auto-generate their codes, or create a custom code."
                  : "Try a different search or filter."
              }
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add QR code
                </Button>
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
                  onToggleActive={() => toggleActive(qr)}
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
        branchId={branchId}
        onSaved={refetch}
      />
    </div>
  );
}

function QrCard({
  qr,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  qr: QrCode;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const isCustom = qr.kind === "custom";
  const value = qrEncodedValue(qr);

  const title = isCustom ? (qr.label ?? "Custom code") : (qr.table?.name ?? "—");
  const typeMeta = isCustom ? CUSTOM_TYPE_META[qr.customType ?? "url"] : null;
  const TypeIconCmp = typeMeta?.icon ?? Utensils;
  const subtitle = isCustom
    ? typeMeta?.label
    : [qr.table?.area?.name ?? "No area", qr.table?.branch?.name].filter(Boolean).join(" · ");

  const safeName = (isCustom ? (qr.label ?? "qr") : (qr.table?.name ?? qr.slug))
    .replace(/\s+/g, "-")
    .toLowerCase();

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${safeName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast(isCustom ? "Content copied" : "Link copied", { tone: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy", { tone: "error" });
    }
  };

  /** Open a print-ready page (QR + label) and trigger the print dialog. */
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
    const heading = esc(title);
    const sub = esc(subtitle ?? "");
    const hint = isCustom ? "Scan with your phone camera" : "Scan to view the menu &amp; order";
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>QR ${heading}</title>` +
        `<style>*{margin:0;box-sizing:border-box}` +
        `body{font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:32px;text-align:center;color:#111}` +
        `img{width:300px;height:300px}h1{font-size:30px;margin-top:20px}` +
        `p{color:#666;margin-top:6px;font-size:15px}.hint{margin-top:14px;font-size:13px;color:#999}` +
        `@media print{@page{margin:12mm}}</style></head><body>` +
        `<img src="${dataUrl}" alt="QR code"/>` +
        `<h1>${heading}</h1>${sub ? `<p>${sub}</p>` : ""}` +
        `<p class="hint">${hint}</p>` +
        `<script>window.onload=function(){window.focus();window.print();};</script>` +
        `</body></html>`,
    );
    win.document.close();
  };

  return (
    <Card className="flex flex-col items-center gap-3 p-4 text-center">
      <div className="flex w-full items-center justify-between gap-2">
        <StatusPill tone={qr.isActive ? "green" : "neutral"}>
          {qr.isActive ? "Active" : "Inactive"}
        </StatusPill>
        <div className="flex shrink-0 gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={qr.isActive ? "Deactivate" : "Activate"}
            title={qr.isActive ? "Deactivate" : "Activate"}
            onClick={onToggleActive}
          >
            <Power
              className={cn("size-4", qr.isActive ? "text-emerald-600" : "text-muted-foreground")}
            />
          </Button>
          {isCustom && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Edit"
                title="Edit"
                onClick={onEdit}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Delete"
                title="Delete"
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border bg-white p-3",
          !qr.isActive && "opacity-50",
        )}
      >
        <QRCodeCanvas value={value || " "} size={132} level="M" marginSize={2} ref={canvasRef} />
      </div>

      <div className="w-full min-w-0">
        <p className="flex items-center justify-center gap-1.5 font-semibold text-ink">
          <TypeIconCmp className="size-3.5 shrink-0 text-brand" />
          <span className="min-w-0 truncate">{title}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex w-full gap-1.5">
        <Button variant="outline" size="sm" className="min-w-0 flex-1" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span className="truncate">{copied ? "Copied" : isCustom ? "Content" : "Link"}</span>
        </Button>
        <Button variant="outline" size="sm" className="min-w-0 flex-1" onClick={download}>
          <Download className="size-4" /> PNG
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label="Print"
          title="Print"
          onClick={print}
        >
          <Printer className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
