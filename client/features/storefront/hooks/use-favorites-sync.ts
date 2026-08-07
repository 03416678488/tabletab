"use client";

import { useEffect } from "react";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useFavoritesStore } from "@/features/storefront/hooks/use-favorites";
import { addFavoriteRemote, fetchFavoriteIds } from "@/features/storefront/services/favorites";

/**
 * Hydrates favorites from the backend once a customer is signed in, and migrates
 * any local-only saves (made before sync existed, or while offline) up to the
 * server. Mount once in the storefront shell.
 */
export function useFavoritesSync() {
  const user = useCustomerSession((s) => s.user);
  const token = useCustomerSession((s) => s.token);

  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const serverIds = await fetchFavoriteIds(token);
        if (cancelled) return;

        // Push up anything saved locally that the server doesn't have yet.
        const local = useFavoritesStore.getState().byCustomer[user.id] ?? [];
        const localOnly = local.filter((id) => !serverIds.includes(id));
        let merged = serverIds;
        for (const id of localOnly) {
          try {
            merged = await addFavoriteRemote(token, id);
          } catch {
            /* best-effort migration */
          }
          if (cancelled) return;
        }

        useFavoritesStore.getState().setFavorites(user.id, merged);
      } catch {
        /* API unreachable — keep the local cache as-is */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, token]);
}
