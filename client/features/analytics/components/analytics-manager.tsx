"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { analyticsService } from "@/features/analytics/services/analytics.service";
import type { Analytics } from "@/features/analytics/types/analytics.types";

const empty = { name: "", code: "", isActive: true };

export function AnalyticsManager() {
  const { items, loading, error, refetch } = useAnalytics();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Analytics | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? { name: editing.name, code: editing.code ?? "", isActive: editing.isActive }
        : empty,
    );
  }, [open, editing]);

  const save = async () => {
    setSaving(true);
    try {
      const body = { name: form.name, code: form.code || undefined, isActive: form.isActive };
      if (editing) await analyticsService.update(editing.id, body);
      else await analyticsService.create(body);
      toast("Analytics saved", { tone: "success" });
      setOpen(false);
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirm = useConfirm();

  const remove = async (a: Analytics) => {
    if (!(await confirm({ title: `Delete ${a.name}?`, confirmLabel: "Delete" }))) return;
    try {
      await analyticsService.remove(a.id);
      toast("Analytics deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Analytics</h2>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4" /> Add Analytics
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState className="py-10" icon={BarChart3} title="Couldn't load" description={error} />
        ) : items.length === 0 ? (
          <EmptyState className="py-10" icon={BarChart3} title="No analytics" description="Add a tracking integration." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <StatusPill tone={a.isActive ? "green" : "neutral"}>
                      {a.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(a); setOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(a)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit analytics" : "Add analytics"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Google Analytics" />
            </div>
            <div className="space-y-1.5">
              <Label>Tracking code / snippet</Label>
              <textarea
                rows={5}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Paste the tracking script or measurement id"
                className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 font-mono text-xs text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="size-4 rounded border-border accent-brand" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saving || !form.name} onClick={save}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
