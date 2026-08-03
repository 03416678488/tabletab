import { Skeleton } from "@/components/ui/skeleton";

const shell = "mx-auto max-w-6xl px-4 sm:px-6";

/** A titled row of square/card placeholders. */
function RowSkeleton({ tile = "size-40", count = 6 }: { tile?: string; count?: number }) {
  return (
    <div>
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={`${tile} shrink-0 rounded-2xl`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Generic landing loading state — mirrors the real layout: search bar, the
 * inline filter row, and a few content rows. Reusable for any menu-style page.
 */
export function LandingSkeleton() {
  return (
    <div className={`${shell} py-4`}>
      {/* Search bar */}
      <Skeleton className="h-12 w-full rounded-full" />

      {/* Filter row (sort + chips) */}
      <div className="mt-3 flex items-center gap-2 overflow-hidden">
        <Skeleton className="h-9 w-32 rounded-full" />
        <span className="h-6 w-px shrink-0 bg-border" aria-hidden />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Content rows */}
      <div className="mt-8 space-y-10">
        <RowSkeleton tile="size-28" count={7} />
        <RowSkeleton tile="size-44" count={5} />
        <RowSkeleton tile="h-56 w-44" count={5} />
      </div>
    </div>
  );
}
