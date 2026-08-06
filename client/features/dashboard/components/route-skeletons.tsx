import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shared page-shell skeletons streamed by each route's `loading.tsx` while its
 *  client bundle and data load. Each mirrors the real page's top-level layout so
 *  the swap to live content is visually stable. */

function PageHeader({ actionWidth = "w-28" }: { actionWidth?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className={`h-9 ${actionWidth} rounded-lg`} />
    </div>
  );
}

/** Stat cards + content blocks — dashboards and reports. */
export function StatsSkeleton() {
  return (
    <div className="w-full space-y-5">
      <PageHeader actionWidth="w-32" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-56 w-full rounded-xl" />
        </Card>
        <Card className="space-y-3 p-5">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </Card>
      </div>
    </div>
  );
}

/** Multi-column card board — KDS, kitchen, OSS, waiter, manager, deliveries. */
export function BoardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader actionWidth="w-24" />
      <div className="mt-5 grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32 rounded-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Product grid + sticky cart — the POS terminal. */
export function PosSkeleton() {
  return (
    <div className="grid w-full gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <Card className="h-fit space-y-4 p-4 lg:sticky lg:top-20">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
        <Skeleton className="mt-2 h-11 w-full rounded-xl" />
      </Card>
    </div>
  );
}

/** Stacked form sections — settings and cash register. */
export function FormSkeleton() {
  return (
    <div className="w-full space-y-8">
      <PageHeader actionWidth="w-24" />
      {Array.from({ length: 3 }).map((_, s) => (
        <Card key={s} className="space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Grid of cards — the tables floor board. */
export function CardGridSkeleton() {
  return (
    <div className="w-full space-y-5">
      <PageHeader actionWidth="w-28" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Header + wide permissions matrix — the roles manager. */
export function MatrixSkeleton() {
  return (
    <div className="w-full space-y-5">
      <PageHeader actionWidth="w-28" />
      <Card className="space-y-3 p-5">
        <Skeleton className="h-8 w-full rounded-lg" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </Card>
    </div>
  );
}

/** Stacked clickable rows — the website builder pages list. */
export function ListRowsSkeleton() {
  return (
    <div className="w-full space-y-5">
      <PageHeader actionWidth="w-28" />
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="size-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
