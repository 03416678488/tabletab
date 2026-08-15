import { Suspense } from "react";
import { OrderListView } from "@/features/order/components/order-list-view";
import { RequireBranch } from "@/features/branch/components/require-branch";
import { Skeleton } from "@/components/ui/skeleton";

export default function TableOrdersPage() {
  return (
    <RequireBranch feature="Table orders">
      <Suspense fallback={<OrderListSkeleton />}>
        <OrderListView orderType="table" title="Table Orders" subtitle="dine-in orders by table." />
      </Suspense>
    </RequireBranch>
  );
}

/** Fallback while the search-params-reading list mounts on the client. */
function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}
