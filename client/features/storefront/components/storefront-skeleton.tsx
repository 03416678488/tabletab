import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page storefront placeholder — a skeleton header, body and footer shown
 * while the branding/settings load, then swapped for the real chrome + content.
 */
export function StorefrontSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-surface/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <Skeleton className="h-4 w-28" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="hidden h-9 w-16 rounded-lg sm:block" />
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {/* Hero / slider */}
          <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-1.5 w-5 rounded-full" />
            ))}
          </div>

          {/* Product grid */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="mt-8 border-t border-border bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
