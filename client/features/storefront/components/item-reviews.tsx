"use client";

import { useEffect, useMemo, useState } from "react";
import { PenLine, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useLocationStore } from "@/hooks/use-location-store";
import { cn } from "@/lib/utils";
import {
  fetchPublishedReviews,
  fetchReviewSummary,
  submitReview,
} from "@/features/review/services/review.service";
import type { Review, ReviewSummary } from "@/features/review/types/review.types";

const STAR_SIZES = { sm: "size-3.5", md: "size-4", lg: "size-7" } as const;

function Stars({
  value,
  size = "sm",
  onSelect,
}: {
  value: number;
  size?: keyof typeof STAR_SIZES;
  onSelect?: (n: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const cls = cn(
          STAR_SIZES[size],
          n <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300",
          onSelect && "cursor-pointer transition-transform hover:scale-110",
        );
        return onSelect ? (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onSelect(n)}
          >
            <Star className={cls} />
          </button>
        ) : (
          <Star key={n} className={cls} />
        );
      })}
    </span>
  );
}

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-teal-500",
];

function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function timeAgo(iso: string): string {
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 30) return `${Math.floor(days)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Approved reviews for an item + a moderated "write a review" form. */
export function ItemReviews({ menuItemId }: { menuItemId: string }) {
  const branchId = useLocationStore((s) => s.branchId);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([fetchReviewSummary(menuItemId), fetchPublishedReviews(menuItemId)])
      .then(([s, r]) => {
        setSummary(s);
        setReviews(r);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItemId]);

  const hasReviews = (summary?.count ?? 0) > 0;

  // Star distribution from the approved reviews (listPublished returns all).
  const distribution = useMemo(() => {
    const d = [0, 0, 0, 0, 0]; // index 0 = 1★ … index 4 = 5★
    for (const r of reviews) if (r.rating >= 1 && r.rating <= 5) d[r.rating - 1] += 1;
    return d;
  }, [reviews]);
  const maxBar = Math.max(1, ...distribution);

  const submit = async () => {
    if (!name.trim() || rating < 1) return;
    setSubmitting(true);
    try {
      await submitReview({
        menuItemId,
        branchId: branchId ?? undefined,
        rating,
        comment: comment.trim() || undefined,
        guestName: name.trim(),
      });
      toast("Thanks! Your review will appear once approved.", { tone: "success" });
      setShowForm(false);
      setName("");
      setComment("");
      setRating(5);
    } catch {
      toast("Couldn't submit your review", { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const shown = showAll ? reviews : reviews.slice(0, 4);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header band */}
      <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-br from-brand-tint/50 to-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Ratings &amp; reviews</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {hasReviews
              ? "What guests thought of this dish"
              : "Tried it? Help others by leaving a review."}
          </p>
        </div>
        {!showForm && (
          <Button size="lg" className="shrink-0" onClick={() => setShowForm(true)}>
            <PenLine className="size-4" />
            Write a review
          </Button>
        )}
      </div>

      <div className="px-5 py-5 sm:px-6">
        {/* Rating hero — score + distribution */}
        {hasReviews && summary && (
          <div className="mb-5 flex flex-col items-stretch gap-6 rounded-xl bg-subtle/50 p-5 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center justify-center sm:min-w-[120px]">
              <span className="font-display text-5xl font-bold leading-none text-ink">
                {summary.average.toFixed(1)}
              </span>
              <div className="mt-2">
                <Stars value={Math.round(summary.average)} size="md" />
              </div>
              <span className="mt-1.5 text-xs text-muted-foreground">
                {summary.count} review{summary.count === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1.5 sm:border-l sm:border-border sm:pl-6">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star - 1];
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex w-6 items-center gap-0.5 tabular-nums">
                      {star}
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/70">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${(count / maxBar) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Write-a-review form */}
        {showForm && (
          <div className="mb-5 space-y-3 rounded-xl border border-brand/20 bg-brand-tint/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-ink">Your rating</span>
              <Stars value={rating} size="lg" onSelect={setRating} />
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others what you thought (optional)"
              rows={3}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Reviews appear after a quick check.
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!name.trim() || submitting} onClick={submit}>
                  {submitting ? "Submitting…" : "Submit review"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!showForm && summary && !hasReviews && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand-deep">
              <Star className="size-7 fill-current" />
            </div>
            <p className="mt-4 font-display text-base font-semibold text-ink">No reviews yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Be the first to rate this dish and help other guests decide.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <PenLine className="size-4" />
              Write the first review
            </Button>
          </div>
        )}

        {/* Review list */}
        {hasReviews && (
          <ul className="space-y-3">
            {shown.map((r) => (
              <li key={r.id} className="rounded-xl border border-border/70 bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                      avatarColor(r.guestName),
                    )}
                  >
                    {initials(r.guestName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-ink">{r.guestName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    <div className="mt-0.5">
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {reviews.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-brand-deep transition-colors hover:bg-secondary"
              >
                {showAll ? "Show fewer" : `Show all ${reviews.length} reviews`}
              </button>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
