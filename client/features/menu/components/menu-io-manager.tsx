"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { menuService, type MenuImportResult } from "@/features/menu/services/menu.service";

export function MenuIoManager() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MenuImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const doExport = async () => {
    setExporting(true);
    try {
      const { csv, count } = await menuService.exportCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-items-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${count} item${count === 1 ? "" : "s"}`, { tone: "success" });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Export failed", { tone: "error" });
    } finally {
      setExporting(false);
    }
  };

  const doImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const csv = await file.text();
      const res = await menuService.importCsv(csv);
      setResult(res);
      const ok = res.created + res.updated;
      toast(
        `${ok} item${ok === 1 ? "" : "s"} imported${res.errors.length ? `, ${res.errors.length} skipped` : ""}`,
        { tone: res.errors.length ? "default" : "success" },
      );
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Import failed", { tone: "error" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
          <FileSpreadsheet className="size-5 text-brand" /> Import / Export Items
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Bulk-edit your menu items with a CSV spreadsheet.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Export */}
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
              <Download className="size-4" />
            </span>
            <h2 className="font-medium text-ink">Export</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Download all items as a CSV. Each row includes the item&apos;s id, so you can edit and
            re-import to update them.
          </p>
          <div>
            <Button onClick={doExport} disabled={exporting}>
              <Download className="size-4" /> {exporting ? "Exporting…" : "Download CSV"}
            </Button>
          </div>
        </Card>

        {/* Import */}
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
              <Upload className="size-4" />
            </span>
            <h2 className="font-medium text-ink">Import</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload an edited CSV. Rows with an <code className="text-ink">id</code> update that
            item; a blank id creates a new one.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              setResult(null);
              setFile(e.target.files?.[0] ?? null);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet className="size-4" /> Choose file
            </Button>
            {file && <span className="truncate text-sm text-muted-foreground">{file.name}</span>}
          </div>
          <div>
            <Button onClick={doImport} disabled={!file || importing}>
              <Upload className="size-4" /> {importing ? "Importing…" : "Import"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Column reference */}
      <Card className="mt-4 p-5">
        <h2 className="font-medium text-ink">CSV columns</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <code className="text-ink">id, name, description, price, category, available</code> —
          category is matched by name (must already exist); available accepts yes/no. Tip: export
          first to get the exact format.
        </p>
      </Card>

      {/* Import result */}
      {result && (
        <Card className="mt-4 space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="size-4" /> {result.created} created
            </span>
            <span className="inline-flex items-center gap-1.5 text-sky-600">
              <CheckCircle2 className="size-4" /> {result.updated} updated
            </span>
            {result.errors.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-amber-600">
                <AlertTriangle className="size-4" /> {result.errors.length} skipped
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Row</th>
                    <th className="px-3 py-2 text-left font-medium">Problem</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{e.row}</td>
                      <td className="px-3 py-2 text-ink">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
