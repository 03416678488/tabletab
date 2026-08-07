import { Skeleton } from "@/components/ui/skeleton";

/**
 * Body placeholder for the branch menu page — mirrors the real layout (branch
 * header, highlights slider, category pills, item rows). Shared by the page's
 * own data-loading state AND the shell's settings-loading state so the two
 * never show as two different skeletons back to back.
 */
export function MenuBodySkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
      <Skeleton className="mb-3 h-8 w-28" />
      <Skeleton className="h-7 w-48 sm:h-9" />
      <Skeleton className="mt-2 h-4 w-64" />

      {/* Highlights slider */}
      <Skeleton className="mb-3 mt-5 h-5 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-52 shrink-0 rounded-2xl sm:h-32 sm:w-56" />
        ))}
      </div>

      {/* Category pills */}
      <div className="mt-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Menu item rows */}
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4">
            <Skeleton className="size-20 shrink-0 rounded-xl sm:size-28" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-page menu skeleton (header + body + footer) for the shell to show while
 *  branding/settings resolve on a `/order/*` route — same body as the page's own
 *  loading state, so the hand-off is seamless. */
export function MenuSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-40 border-b border-border bg-surface/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <Skeleton className="h-4 w-28" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
        </div>
      </div>
      <main className="flex-1">
        <MenuBodySkeleton />
      </main>
    </>
  );
}
