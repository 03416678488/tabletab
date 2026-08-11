"use client";

import { useState } from "react";
import { Check, MessageSquareText, Search, Star, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { formatDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { usePaginatedReviews } from "@/features/review/hooks/use-paginated-reviews";
import { reviewService } from "@/features/review/services/review.service";
import type { Review, ReviewStatus } from "@/features/review/types/review.types";

type StatusFilter = "all" | ReviewStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const STATUS_TONE: Record<ReviewStatus, "amber" | "green" | "red"> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-3.5", n <= value ? "fill-amber-400 text-amber-400" : "text-border")}
        />
      ))}
    </span>
  );
}

export function ReviewManager() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();

  const {
    reviews,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedReviews({ search, status: status === "all" ? undefined : status });

  const moderate = async (review: Review, next: ReviewStatus, label: string) => {
    setBusyId(review.id);
    try {
      await reviewService.setStatus(review.id, next);
      toast(label, { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update review", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (review: Review) => {
    if (!(await confirm({ title: `Delete this review?`, confirmLabel: "Delete" }))) return;
    setBusyId(review.id);
    try {
      await reviewService.remove(review.id);
      toast("Review deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete review", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <MessageSquareText className="size-6 text-brand" />
          Item reviews
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guest reviews stay hidden until you approve them — only approved reviews appear on the
          storefront.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border bg-white p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatus(t.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                status === t.value
                  ? "bg-brand text-primary-foreground"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest name…"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableRowsSkeleton rows={6} />
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={MessageSquareText}
            title="Couldn't load reviews"
            description={error}
          />
        ) : reviews.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={MessageSquareText}
            title="No reviews here"
            description={
              status === "pending"
                ? "New guest reviews awaiting moderation will show up here."
                : "Nothing matches this filter."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-ink">{r.menuItem?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-ink">{r.guestName}</div>
                    {r.guestEmail && (
                      <div className="text-xs text-muted-foreground">{r.guestEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stars value={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-[18rem]">
                    <p className="truncate text-sm text-muted-foreground" title={r.comment ?? ""}>
                      {r.comment || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status !== "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Approve"
                          title="Approve & publish"
                          disabled={busyId === r.id}
                          onClick={() => moderate(r, "approved", "Review approved & published")}
                        >
                          <Check className="size-4 text-emerald-600" />
                        </Button>
                      )}
                      {r.status !== "rejected" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Reject"
                          title="Reject"
                          disabled={busyId === r.id}
                          onClick={() => moderate(r, "rejected", "Review rejected")}
                        >
                          <X className="size-4 text-rose-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        disabled={busyId === r.id}
                        onClick={() => remove(r)}
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

      {!loading && !error && reviews.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      {!loading && !error && totalItems > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{totalItems} review(s)</p>
      )}
    </div>
  );
}
