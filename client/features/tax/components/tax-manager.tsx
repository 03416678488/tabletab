"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Percent, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
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

import { useTaxes } from "@/features/tax/hooks/use-taxes";
import { useDefaultTax } from "@/features/tax/hooks/use-default-tax";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { taxService, type Tax } from "@/features/tax/services/tax.service";
import { useClientPagination } from "@/hooks/use-client-pagination";

const empty = { name: "", code: "", rate: "0", isActive: true };

export function TaxManager() {
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const { taxes, loading, error, refetch } = useTaxes(branchId);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return taxes;
    return taxes.filter((t) => `${t.name} ${t.code}`.toLowerCase().includes(q));
  }, [taxes, search]);
  const { page, setPage, perPage, setPerPage, totalPages, totalItems, pageItems } =
    useClientPagination(filtered);
  const { defaultTax, setDefault } = useDefaultTax();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tax | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name,
            code: editing.code,
            rate: String(editing.rate),
            isActive: editing.isActive,
          }
        : empty,
    );
  }, [open, editing]);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        name: form.name,
        code: form.code,
        rate: Number(form.rate) || 0,
        isActive: form.isActive,
      };
      if (editing) await taxService.update(editing.id, body);
      else await taxService.create({ ...body, ...(branchId ? { branchId } : {}) });
      toast("Tax saved", { tone: "success" });
      setOpen(false);
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirm = useConfirm();

  const remove = async (t: Tax) => {
    if (!(await confirm({ title: `Delete ${t.name} (${t.code})?`, confirmLabel: "Delete" })))
      return;
    try {
      await taxService.remove(t.id);
      toast("Tax deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Taxes</h2>
        <div className="flex items-center gap-2">
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search taxes…"
              className="h-9 pl-9"
              aria-label="Search taxes"
            />
          </div>
          {defaultTax && (
            <Button variant="outline" size="sm" onClick={() => void setDefault("")}>
              Clear default
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (!branchId) {
                toast("Select a branch first to add a tax", { tone: "info" });
                return;
              }
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Tax
          </Button>
        </div>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState className="py-10" icon={Percent} title="Couldn't load" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-10"
            icon={Percent}
            title={search.trim() ? "No matches" : "No taxes"}
            description={search.trim() ? "Try a different search." : "Add one to get started."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Tax Rate</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.code}</TableCell>
                  <TableCell className="text-muted-foreground">{t.rate.toFixed(2)}</TableCell>
                  <TableCell>
                    <input
                      type="radio"
                      name="default-tax"
                      className="size-4 accent-brand"
                      aria-label={`Set ${t.name} as default tax`}
                      checked={defaultTax === `t:${t.id}`}
                      onChange={() => void setDefault(`t:${t.id}`)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={t.isActive ? "green" : "neutral"}>
                      {t.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(t);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(t)}
                      >
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

      {!loading && !error && filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit tax" : "Add tax"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rate (%)</Label>
                <Input
                  type="number"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-brand"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving || !form.name || !form.code} onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
