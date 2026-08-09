"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Monitor, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
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

import { useKioskMachines } from "@/features/kiosk-machine/hooks/use-kiosk-machines";
import { kioskMachineService } from "@/features/kiosk-machine/services/kiosk-machine.service";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useClientPagination } from "@/hooks/use-client-pagination";
import type { KioskMachine } from "@/features/kiosk-machine/types/kiosk-machine.types";

const empty = { machineId: "", userName: "", username: "", branchId: "", isActive: true };

export function KioskMachineManager() {
  const { machines, loading, error, refetch } = useKioskMachines();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return machines;
    return machines.filter((m) =>
      `${m.machineId} ${m.userName ?? ""} ${m.username} ${m.branch?.name ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [machines, search]);
  const { page, setPage, perPage, setPerPage, totalPages, totalItems, pageItems } =
    useClientPagination(filtered);
  const { branches } = useBranches();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KioskMachine | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            machineId: editing.machineId,
            userName: editing.userName ?? "",
            username: editing.username,
            branchId: editing.branchId ?? "",
            isActive: editing.isActive,
          }
        : empty,
    );
  }, [open, editing]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        machineId: form.machineId,
        username: form.username,
        userName: form.userName || undefined,
        branchId: form.branchId || undefined,
        isActive: form.isActive,
      };
      if (editing) await kioskMachineService.update(editing.id, body);
      else await kioskMachineService.create(body);
      toast("Kiosk machine saved", { tone: "success" });
      setOpen(false);
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m: KioskMachine) => {
    try {
      await kioskMachineService.update(m.id, { isActive: !m.isActive });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", { tone: "error" });
    }
  };

  const confirm = useConfirm();

  const remove = async (m: KioskMachine) => {
    if (!(await confirm({ title: `Delete machine ${m.machineId}?`, confirmLabel: "Delete" })))
      return;
    try {
      await kioskMachineService.remove(m.id);
      toast("Kiosk machine deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Kiosk Machines</h2>
        <div className="flex items-center gap-2">
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search kiosks…"
              className="h-9 pl-9"
              aria-label="Search kiosk machines"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> Add Kiosk Machine
          </Button>
        </div>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState className="py-10" icon={Monitor} title="Couldn't load" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-10"
            icon={Monitor}
            title={search.trim() ? "No matches" : "No kiosk machines"}
            description={
              search.trim() ? "Try a different search." : "Register a kiosk to get started."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Machine ID</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.machineId}</TableCell>
                  <TableCell className="text-muted-foreground">{m.branch?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.userName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.username}</TableCell>
                  <TableCell>
                    <button type="button" onClick={() => toggle(m)}>
                      <StatusPill tone={m.isActive ? "green" : "neutral"}>
                        {m.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(m);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(m)}
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
            <DialogTitle>{editing ? "Edit kiosk machine" : "Add kiosk machine"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Machine ID">
              <Input
                value={form.machineId}
                onChange={(e) => setForm({ ...form, machineId: e.target.value })}
              />
            </Field>
            <Field label="Branch">
              <Dropdown
                value={form.branchId}
                onChange={(v) => setForm({ ...form, branchId: v })}
                searchable
                placeholder="— No branch —"
                aria-label="Branch"
                options={[
                  { value: "", label: "— No branch —" },
                  ...branches.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
            </Field>
            <Field label="User (display name)">
              <Input
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
              />
            </Field>
            <Field label="Username">
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </Field>
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
            <Button disabled={saving || !form.machineId || !form.username} onClick={save}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save
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
