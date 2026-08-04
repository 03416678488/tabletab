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

/** A wide image-slider placeholder with pagination dots. */
function SliderSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
      <div className="mt-3 flex justify-center gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-1.5 w-5 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Landing loading state — mirrors the real body: an image slider up top, then a
 * few content rows. Reusable for any menu-style page.
 */
export function LandingSkeleton() {
  return (
    <div className={`${shell} py-4`}>
      <SliderSkeleton />

      {/* Content rows */}
      <div className="mt-8 space-y-10">
        <RowSkeleton tile="size-28" count={7} />
        <RowSkeleton tile="size-44" count={5} />
        <RowSkeleton tile="h-56 w-44" count={5} />
      </div>
    </div>
  );
}
