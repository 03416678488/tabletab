"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useTaxes } from "@/features/tax/hooks/use-taxes";
import { useTaxGroups } from "@/features/tax/hooks/use-tax-groups";
import { useDefaultTax } from "@/features/tax/hooks/use-default-tax";
import { taxGroupService, groupRate, type TaxGroup } from "@/features/tax/services/tax-group.service";

export function TaxGroupManager() {
  const { groups, loading, error, refetch } = useTaxGroups();
  const { taxes } = useTaxes();
  const { defaultTax, setDefault } = useDefaultTax();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxGroup | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [taxIds, setTaxIds] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setCode(editing?.code ?? "");
    setTaxIds(editing?.taxes.map((t) => t.id) ?? []);
    setIsActive(editing?.isActive ?? true);
  }, [open, editing]);

  const draftRate = useMemo(
    () => taxes.filter((t) => taxIds.includes(t.id)).reduce((s, t) => s + t.rate, 0),
    [taxes, taxIds],
  );

  const toggleTax = (id: number) =>
    setTaxIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    setSaving(true);
    try {
      const body = { name, code: code || undefined, taxIds, isActive };
      if (editing) await taxGroupService.update(editing.id, body);
      else await taxGroupService.create(body);
      toast("Tax group saved", { tone: "success" });
      setOpen(false);
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (g: TaxGroup) => {
    if (!confirm(`Delete "${g.name}"?`)) return;
    try {
      await taxGroupService.remove(g.id);
      toast("Tax group deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">VAT Group</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Bundle several taxes to apply together.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {defaultTax && (
            <Button variant="outline" size="sm" onClick={() => void setDefault("")}>
              Clear default
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Add group
          </Button>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState className="py-12" icon={Layers} title="Couldn't load" description={error} />
        ) : groups.length === 0 ? (
          <EmptyState className="py-12" icon={Layers} title="No tax groups" description="Create a group to combine taxes." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Taxes</TableHead>
                <TableHead>Combined</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">{g.code ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {g.taxes.map((t) => (
                        <StatusPill key={t.id} tone="blue" dot={false} className="text-[10px]">
                          {t.name} {t.rate}%
                        </StatusPill>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{groupRate(g)}%</TableCell>
                  <TableCell>
                    <input
                      type="radio"
                      name="default-tax"
                      className="size-4 accent-brand"
                      aria-label={`Set ${g.name} as default tax`}
                      checked={defaultTax === `g:${g.id}`}
                      onChange={() => void setDefault(`g:${g.id}`)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={g.isActive ? "green" : "neutral"}>
                      {g.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(g);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(g)}>
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
            <DialogTitle>{editing ? "Edit tax group" : "Add tax group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="optional" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Taxes ({draftRate}% combined)</Label>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                {taxes.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No taxes yet.</p>
                ) : (
                  taxes.map((t) => (
                    <label
                      key={t.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors",
                        taxIds.includes(t.id) ? "bg-brand-tint/50" : "hover:bg-secondary",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-brand"
                          checked={taxIds.includes(t.id)}
                          onChange={() => toggleTax(t.id)}
                        />
                        {t.name} <span className="text-muted-foreground">({t.code})</span>
                      </span>
                      <span className="font-medium">{t.rate}%</span>
                    </label>
                  ))
                )}
              </div>
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
            <Button disabled={saving || !name || taxIds.length === 0} onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
