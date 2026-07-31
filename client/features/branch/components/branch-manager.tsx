"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { branchService } from "@/features/branch/services/branch.service";
import { BranchFormDialog } from "@/features/branch/components/branch-form-dialog";
import type { Branch } from "@/features/branch/types/branch.types";

export function BranchManager() {
  const { branches, loading, error, refetch } = useBranches();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setDialogOpen(true);
  };

  const remove = async (branch: Branch) => {
    if (!confirm(`Delete "${branch.name}"? This cannot be undone.`)) return;
    try {
      await branchService.remove(branch.id);
      toast("Branch deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete branch", {
        tone: "error",
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Branches
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your restaurant locations.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Add branch
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : error ? (
          <EmptyState
            icon={MapPin}
            title="Couldn't load branches"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : branches.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No branches yet"
            description="Add your first branch to get started."
            action={
              <Button onClick={openCreate}>
                <Plus /> Add branch
              </Button>
            }
          />
        ) : (
          branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{branch.name}</p>
                    <StatusPill tone={branch.isOpen ? "green" : "neutral"}>
                      {branch.isOpen ? "Open" : "Closed"}
                    </StatusPill>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {branch.address}, {branch.city} · {branch.phone}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    onClick={() => openEdit(branch)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => remove(branch)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BranchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editing}
        onSaved={refetch}
      />
    </div>
  );
}
