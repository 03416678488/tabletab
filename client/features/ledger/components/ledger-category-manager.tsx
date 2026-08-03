"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

import { ledgerService, type LedgerCategory, type LedgerConfig } from "@/features/ledger/ledger";

export function LedgerCategoryManager({ config }: { config: LedgerConfig }) {
  const svc = useMemo(() => ledgerService(config.base), [config.base]);
  const [categories, setCategories] = useState<LedgerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerCategory | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await svc.categories());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.base]);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setIsActive(editing?.isActive ?? true);
  }, [open, editing]);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await svc.updateCategory(editing.id, { name, isActive });
      else await svc.createCategory({ name, isActive });
      toast("Category saved", { tone: "success" });
      setOpen(false);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirm = useConfirm();

  const remove = async (c: LedgerCategory) => {
    if (!(await confirm({ title: `Delete "${c.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await svc.removeCategory(c.id);
      toast("Category deleted", { tone: "success" });
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <Tags className="size-5 text-brand" /> {config.title} Categories
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <EmptyState className="py-10" icon={Tags} title="Couldn't load" description={error} />
        ) : categories.length === 0 ? (
          <EmptyState className="py-10" icon={Tags} title="No categories" description="Add one to get started." />
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
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <StatusPill tone={c.isActive ? "green" : "neutral"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(c)}>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-brand"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving || !name} onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
