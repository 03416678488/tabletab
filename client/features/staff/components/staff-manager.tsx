"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, SlidersHorizontal, Trash2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
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
import { ROLE_LABELS } from "@/lib/nav";
import type { StaffRole } from "@/lib/types";

import { useStaff } from "@/features/staff/hooks/use-staff";
import { staffService } from "@/features/staff/services/staff.service";
import { STAFF_ROLES } from "@/features/staff/constants/staff.constants";
import { StaffFormDialog } from "@/features/staff/components/staff-form-dialog";
import { useBranches } from "@/features/branch/hooks/use-branches";
import type { Staff } from "@/features/staff/types/staff.types";

const SELECT_CLASS =
  "h-9 appearance-none rounded-lg border border-input bg-white px-3 pr-8 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

const ROLE_TONE: Record<StaffRole, "brand" | "blue" | "purple" | "amber"> = {
  admin: "brand",
  manager: "blue",
  chef: "purple",
  waiter: "amber",
};

type StatusFilter = "all" | "active" | "inactive";

export function StaffManager() {
  const { staff, loading, error, refetch } = useStaff();
  const { branches } = useBranches();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [role, setRole] = useState<StaffRole | "all">("all");
  const [branchId, setBranchId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((m) => {
      if (role !== "all" && m.role !== role) return false;
      if (branchId !== "all" && m.branchId !== branchId) return false;
      if (status === "active" && !m.isActive) return false;
      if (status === "inactive" && m.isActive) return false;
      if (q) {
        const hay = `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [staff, search, role, branchId, status]);

  const activeFilters =
    (role !== "all" ? 1 : 0) + (branchId !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (member: Staff) => {
    setEditing(member);
    setDialogOpen(true);
  };
  const clearFilters = () => {
    setRole("all");
    setBranchId("all");
    setStatus("all");
  };

  const remove = async (member: Staff) => {
    if (!confirm(`Remove ${member.firstName} ${member.lastName}?`)) return;
    try {
      await staffService.remove(member.id);
      toast("Staff removed", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to remove staff", {
        tone: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            Staff
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {staff.filter((s) => s.isActive).length} active of {staff.length} team members.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add staff
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="h-9 pl-9"
            aria-label="Search staff"
          />
        </div>
        <Button
          variant={showFilters || activeFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="size-4" /> Filters
          {activeFilters > 0 && (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
              {activeFilters}
            </span>
          )}
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} of {staff.length}
        </span>
      </div>

      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Role
            <select
              className={SELECT_CLASS}
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole | "all")}
            >
              <option value="all">All</option>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Branch
            <select
              className={SELECT_CLASS}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="all">All</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <select
              className={SELECT_CLASS}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={Users}
            title="Couldn't load staff"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Users}
            title={staff.length === 0 ? "No staff yet" : "No matches"}
            description={
              staff.length === 0
                ? "Add your first team member to get started."
                : "Try adjusting your search or filters."
            }
            action={
              staff.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add staff
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-brand-tint text-[11px] font-semibold text-brand-deep">
                        {(member.firstName[0] ?? "") + (member.lastName[0] ?? "")}
                      </span>
                      <span className="font-medium">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <StatusPill tone={ROLE_TONE[member.role]}>
                      {ROLE_LABELS[member.role]}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.branch?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={member.isActive ? "green" : "neutral"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(member)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        onClick={() => remove(member)}
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

      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editing}
        onSaved={refetch}
      />
    </div>
  );
}
