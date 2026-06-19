"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ProductView } from "@/components/venue/product-view";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { MenuItem } from "@/lib/types";

export default function VenueItemPage({
  params,
}: {
  params: Promise<{ token: string; itemId: string }>;
}) {
  const { token, itemId } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getMenuItem(itemId).then((m) => {
      if (!cancelled) {
        setItem(m ?? null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-surface">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!item || !item.isAvailable) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface p-6">
        <EmptyState
          title={item ? "Sold out" : "Item not found"}
          description="This item isn't available right now."
          action={
            <Button variant="outline" onClick={() => router.push(`/t/${token}`)}>
              Back to menu
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <ProductView key={itemId} item={item} token={token} />
    </AnimatePresence>
  );
}
