"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
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
import { toast } from "@/hooks/use-toast";

import { useUsers } from "@/features/app-user/hooks/use-users";
import { appUserService } from "@/features/app-user/services/app-user.service";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useClientPagination } from "@/hooks/use-client-pagination";

/** Roles that span all branches — branch assignment doesn't apply to them. */
const CROSS_BRANCH_ROLES = new Set(["Owner", "Multi Branch Manager"]);

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
  // Optimistic branch selections keyed by userId (before the refetch settles).
  const [branchEdits, setBranchEdits] = useState<Record<string, string | null>>({});

  const assignBranch = async (userId: string, value: string) => {
    const branchId = value || null;
    setBranchEdits((prev) => ({ ...prev, [userId]: branchId }));
    try {
      await appUserService.setBranch(userId, branchId);
    } catch {
      setBranchEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      toast("Couldn't update branch", { tone: "error" });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.phone ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [users, search]);

  const { page, setPage, perPage, setPerPage, totalPages, totalItems, pageItems } =
    useClientPagination(filtered);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {description ?? `${users.length} user${users.length === 1 ? "" : "s"} in this role.`}
          </p>
        </div>
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
                      <Dropdown
                        className="w-44"
                        aria-label={`Branch for ${u.firstName} ${u.lastName}`}
                        value={(u.id in branchEdits ? branchEdits[u.id] : u.branchId) ?? ""}
                        onChange={(v) => void assignBranch(u.id, v)}
                        searchable={branches.length > 8}
                        options={[
                          { value: "", label: "All branches" },
                          ...branches.map((b) => ({ value: b.id, label: b.name })),
                        ]}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusPill tone={u.isActive ? "green" : "neutral"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </StatusPill>
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
    </div>
  );
}
