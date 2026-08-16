"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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

import { useUsers } from "@/features/app-user/hooks/use-users";
import { appUserService } from "@/features/app-user/services/app-user.service";
import { UserFormDialog } from "@/features/app-user/components/user-form-dialog";
import type { AppUser } from "@/features/app-user/types/app-user.types";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useClientPagination } from "@/hooks/use-client-pagination";

/** Roles that span all branches (or none) — a home branch doesn't apply. Every
 *  other role is a single-branch employee that MUST be assigned a branch. */
const CROSS_BRANCH_ROLES = new Set(["Owner", "Multi Branch Manager", "Customer"]);

interface UsersManagerProps {
  /** Role name as stored in the DB (e.g. "Waiters"). Omit for all users. */
  roleName?: string;
  title: string;
  description?: string;
}

export function UsersManager({ roleName, title, description }: UsersManagerProps) {
  const { users, loading, error, refetch } = useUsers(roleName);
  const { branches } = useBranches();
  const [search, setSearch] = useState("");

  // Branch assignment only makes sense for branch-scoped roles.
  const showBranch = !roleName || !CROSS_BRANCH_ROLES.has(roleName);
  const branchName = (id: string | null) => (id && branches.find((b) => b.id === id)?.name) || null;

  const confirm = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (user: AppUser) => {
    setEditing(user);
    setDialogOpen(true);
  };
  const remove = async (user: AppUser) => {
    const name = `${user.firstName} ${user.lastName}`.trim();
    if (!(await confirm({ title: `Delete "${name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await appUserService.remove(user.id);
      refetch();
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.phone ?? ""}`.toLowerCase().includes(q),
    );
  }, [users, search]);

  const { page, setPage, perPage, setPerPage, totalPages, totalItems, pageItems } =
    useClientPagination(filtered);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {description ?? `${users.length} user${users.length === 1 ? "" : "s"} in this role.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="h-9 pl-9"
              aria-label="Search users"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> Add user
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
          <EmptyState
            className="py-12"
            icon={Users}
            title="Couldn't load users"
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
            title={users.length === 0 ? "No users yet" : "No matches"}
            description={
              users.length === 0
                ? "Users assigned to this role will appear here."
                : "Try a different search."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                {showBranch && <TableHead>Branch</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((u) => (
                <TableRow key={`${u.id}-${u.roleName}`}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-brand-tint text-[11px] font-semibold text-brand-deep">
                        {(u.firstName[0] ?? "") + (u.lastName[0] ?? "")}
                      </span>
                      <span className="font-medium">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.phone ?? "—"}</TableCell>
                  <TableCell>
                    <StatusPill tone="blue">{u.roleName ?? "—"}</StatusPill>
                  </TableCell>
                  {showBranch && (
                    <TableCell>
                      {branchName(u.branchId) ?? (
                        <span className="text-xs font-medium text-destructive">Not assigned</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusPill tone={u.isActive ? "green" : "neutral"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${u.firstName} ${u.lastName}`}
                        onClick={() => openEdit(u)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${u.firstName} ${u.lastName}`}
                        onClick={() => remove(u)}
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

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        roleName={roleName}
        showBranch={showBranch}
        onSaved={refetch}
      />
    </div>
  );
}
