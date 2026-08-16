"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { categoryService } from "@/features/category/services/category.service";
import type { Category } from "@/features/category/types/category.types";

/** All categories, optionally scoped to one branch (categories are per-branch). */
export function useCategories(branchId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.list({ perPage: 100, ...(branchId ? { branchId } : {}) });
      setCategories(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { categories, loading, error, refetch };
}
