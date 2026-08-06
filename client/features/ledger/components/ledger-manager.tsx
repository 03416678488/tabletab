"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Dropdown } from "@/components/ui/dropdown";
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
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import {
  ledgerService,
  PAYMENT_TYPES,
  type LedgerCategory,
  type LedgerConfig,
  type LedgerRecord,
} from "@/features/ledger/ledger";
import { useClientPagination } from "@/hooks/use-client-pagination";

const todayISO = () => new Date().toISOString().slice(0, 10);

interface FormState {
  amount: string;
  categoryId: string;
  forText: string;
  paymentType: string;
  referenceNumber: string;
  date: string;
  note: string;
}

const emptyForm = (): FormState => ({
  amount: "",
  categoryId: "",
  forText: "",
  paymentType: "",
  referenceNumber: "",
  date: todayISO(),
  note: "",
});

export function LedgerManager({ config }: { config: LedgerConfig }) {
  const svc = useMemo(() => ledgerService(config.base), [config.base]);
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [categories, setCategories] = useState<LedgerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recs, cats] = await Promise.all([svc.list(), svc.categories()]);
      setRecords(recs);
      setCategories(cats);
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

  const total = useMemo(() => records.reduce((s, r) => s + r.amount, 0), [records]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      `${r[config.forField] ?? ""} ${r.category?.name ?? ""} ${r.referenceNumber ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [records, search, config.forField]);
  const { page, setPage, perPage, setPerPage, totalPages, totalItems, pageItems } =
    useClientPagination(filtered);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const openEdit = (r: LedgerRecord) => {
    setEditing(r);
    setForm({
      amount: String(r.amount),
      categoryId: r.categoryId ? String(r.categoryId) : "",
      forText: (r[config.forField] as string) ?? "",
      paymentType: r.paymentType ?? "",
      referenceNumber: r.referenceNumber ?? "",
      date: r.date ?? todayISO(),
      note: r.note ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        amount: Number(form.amount) || 0,
        [config.forField]: form.forText || undefined,
        paymentType: form.paymentType || undefined,
        referenceNumber: form.referenceNumber || undefined,
        date: form.date || undefined,
        note: form.note || undefined,
        ...(form.categoryId ? { categoryId: Number(form.categoryId) } : {}),
      };
      if (editing) await svc.update(editing.id, body);
      else await svc.create(body);
      toast(`${config.title} saved`, { tone: "success" });
      setOpen(false);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirm = useConfirm();

  const remove = async (r: LedgerRecord) => {
    if (!(await confirm({ title: "Delete this entry?", confirmLabel: "Delete" }))) return;
    try {
      await svc.remove(r.id);
      toast("Deleted", { tone: "success" });
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <Receipt className="size-5 text-brand" /> {config.title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {records.length} entr{records.length === 1 ? "y" : "ies"} · total {formatMoney(total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-9 pl-9"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> Create {config.title}
          </Button>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState className="py-12" icon={Receipt} title="Couldn't load" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Receipt}
            title={records.length === 0 ? `No ${config.title.toLowerCase()} yet` : "No matches"}
            description={records.length === 0 ? "Create your first entry." : "Try a different search."}
            action={
              records.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Create {config.title}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>{config.title} For</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{r.date ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.category?.name ?? "—"}</TableCell>
                    <TableCell>{(r[config.forField] as string) || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.paymentType ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.referenceNumber ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-ink">
                      {formatMoney(r.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(r)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(r)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${config.title}` : `Create ${config.title}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <Input
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </Field>
            <Field label="Category">
              <Dropdown
                value={form.categoryId}
                onChange={(v) => setForm({ ...form, categoryId: v })}
                placeholder="Select A Category"
                options={[
                  { value: "", label: "— None —" },
                  ...categories
                    .filter((c) => c.isActive)
                    .map((c) => ({ value: String(c.id), label: c.name })),
                ]}
              />
            </Field>
            <Field label={config.forLabel}>
              <Input
                value={form.forText}
                onChange={(e) => setForm({ ...form, forText: e.target.value })}
                placeholder={`Enter ${config.forLabel.toLowerCase()}`}
              />
            </Field>
            <Field label="Payment Type">
              <Dropdown
                value={form.paymentType}
                onChange={(v) => setForm({ ...form, paymentType: v })}
                placeholder="Select a payment type"
                options={[
                  { value: "", label: "— None —" },
                  ...PAYMENT_TYPES.map((p) => ({ value: p, label: p })),
                ]}
              />
            </Field>
            <Field label="Reference Number">
              <Input
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                placeholder="Enter reference number"
              />
            </Field>
            <Field label={config.dateLabel}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Note">
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Enter Note"
                  className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving || !form.amount} onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
