"use client";

import { useEffect, useState } from "react";
import { Loader2, Monitor, Pencil, Plus, Trash2 } from "lucide-react";

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
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useKioskMachines } from "@/features/kiosk-machine/hooks/use-kiosk-machines";
import { kioskMachineService } from "@/features/kiosk-machine/services/kiosk-machine.service";
import { useBranches } from "@/features/branch/hooks/use-branches";
import type { KioskMachine } from "@/features/kiosk-machine/types/kiosk-machine.types";

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

const empty = { machineId: "", userName: "", username: "", branchId: "", isActive: true };

export function KioskMachineManager() {
  const { machines, loading, error, refetch } = useKioskMachines();
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

  const remove = async (m: KioskMachine) => {
    if (!confirm(`Delete machine ${m.machineId}?`)) return;
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
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Add Kiosk Machine
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <EmptyState className="py-10" icon={Monitor} title="Couldn't load" description={error} />
        ) : machines.length === 0 ? (
          <EmptyState
            className="py-10"
            icon={Monitor}
            title="No kiosk machines"
            description="Register a kiosk to get started."
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
              {machines.map((m) => (
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
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(m); setOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(m)}>
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
            <DialogTitle>{editing ? "Edit kiosk machine" : "Add kiosk machine"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Machine ID">
              <Input value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} />
            </Field>
            <Field label="Branch">
              <select className={SELECT_CLASS} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                <option value="">— No branch —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <Field label="User (display name)">
              <Input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
            </Field>
            <Field label="Username">
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="size-4 rounded border-border accent-brand" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
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
