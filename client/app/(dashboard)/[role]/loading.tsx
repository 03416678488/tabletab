import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";

/**
 * Streamed instantly on every dashboard navigation while the target route's
 * client bundle and data load. The AppShell (sidebar/topbar) stays mounted from
 * the layout — only this content area is replaced — so module switches feel
 * immediate instead of showing a frozen page.
 */
export default function DashboardLoading() {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <TableRowsSkeleton />
      </Card>
    </div>
  );
}
