"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { menusService } from "@/features/menu-list/services/menu.service";
import type { Menu } from "@/features/menu-list/types/menu.types";

/** All menus (unpaginated) — used to populate dropdowns/multiselects. */
export function useMenus() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await menusService.list({ perPage: 100 });
      setMenus(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load menus");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { menus, loading, error, refetch };
}
