"use client";

import { useState } from "react";
import { BadgePercent, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

import { usePaginatedPromotions } from "@/features/promotion/hooks/use-paginated-promotions";
import { promotionService } from "@/features/promotion/services/promotion.service";
import { PromotionFormDialog } from "@/features/promotion/components/promotion-form-dialog";
import type { Promotion } from "@/features/promotion/types/promotion.types";

type Tone = "green" | "amber" | "red" | "neutral";

function promoStatus(p: Promotion): { label: string; tone: Tone } {
  if (!p.active) return { label: "Inactive", tone: "neutral" };
  const now = Date.now();
  if (p.endsAt && new Date(p.endsAt).getTime() < now) return { label: "Expired", tone: "red" };
  if (p.startsAt && new Date(p.startsAt).getTime() > now)
    return { label: "Scheduled", tone: "amber" };
  return { label: "Live", tone: "green" };
}

function discountLabel(p: Promotion): string {
  return p.discountType === "percentage"
    ? `${p.discountValue}% off`
    : `${formatCurrency(p.discountValue)} off`;
}

export function PromotionsManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [search, setSearch] = useState("");

  const {
    promotions,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedPromotions({ search });

  const filtersActive = Boolean(search.trim());

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (promotion: Promotion) => {
    setEditing(promotion);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (promotion: Promotion) => {
    if (!(await confirm({ title: `Delete "${promotion.title}"?`, confirmLabel: "Delete" }))) return;
    try {
      await promotionService.remove(promotion.id);
      if (promotions.length === 1 && page > 1) goToPage(page - 1);
      else refetch();
    } catch {}
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Promotions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} promotion{totalItems === 1 ? "" : "s"} · discounts, codes & landing pages.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> New promotion
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search promotions…"
            className="h-9 pl-9"
            aria-label="Search promotions"
          />
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {promotions.length} of {totalItems}
        </span>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={BadgePercent}
            title="Couldn't load promotions"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : promotions.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={BadgePercent}
            title={filtersActive ? "No matches" : "No promotions yet"}
            description={
              filtersActive
                ? "Try a different search."
                : "Create your first promotion to run a discount or a landing page."
            }
            action={
              filtersActive ? undefined : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> New promotion
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Promotion</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => {
                const status = promoStatus(promotion);
                return (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div className="font-medium text-ink">{promotion.title}</div>
                      <div className="text-xs text-muted-foreground">/{promotion.slug}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {discountLabel(promotion)}
                    </TableCell>
                    <TableCell>
                      {promotion.code ? (
                        <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold">
                          {promotion.code}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">Auto</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {promotion.usageCount}
                      {promotion.usageLimit != null ? `/${promotion.usageLimit}` : ""}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => openEdit(promotion)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => remove(promotion)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {!loading && !error && promotions.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <PromotionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotion={editing}
        onSaved={refetch}
      />
    </div>
  );
}
