"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useBranchesStream } from "@/hooks/use-branches-stream";
import { useMenuStream } from "@/hooks/use-menu-stream";

/**
 * Keeps the storefront's cached data live. Subscribes to the branch + menu SSE
 * streams and invalidates the matching React Query caches so the customer UI
 * reconciles in real time:
 *
 *  - `branch.changed` → open/closed, online-ordering, delivery/pickup toggles,
 *    fees, and reservation settings (all branch fields) → re-derives fulfillment.
 *  - `menu.changed`   → item added/removed, price change, or availability
 *    ("sold out") → the flat product list, categories, and the paged catalog all
 *    refetch. Sold-out items are filtered server/client-side so they disappear.
 *
 * Drop this into any storefront screen that reads branch or menu data.
 */
export function useStorefrontSync(): void {
  const queryClient = useQueryClient();

  useBranchesStream(() => {
    void queryClient.invalidateQueries({ queryKey: ["storefront", "branches"] });
  });

  useMenuStream(() => {
    void queryClient.invalidateQueries({ queryKey: ["storefront", "products"] });
    void queryClient.invalidateQueries({ queryKey: ["storefront", "categories"] });
    void queryClient.invalidateQueries({ queryKey: ["storefront", "catalog"] });
    void queryClient.invalidateQueries({ queryKey: ["storefront", "menus"] });
  });
}
