"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { reviewService } from "@/features/review/services/review.service";
import type { Review, ReviewStatus } from "@/features/review/types/review.types";

interface Params {
  search?: string;
  status?: ReviewStatus;
}

/** Server-paginated reviews for the moderation table. */
export function usePaginatedReviews({ search, status }: Params = {}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${search ?? ""}|${status ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await reviewService.list({
          page: p,
          perPage,
          search: search || undefined,
          status,
        });
        if (keyRef.current !== activeKey) return;
        setReviews(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load reviews");
      } finally {
        if (keyRef.current === activeKey) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    const t = setTimeout(() => void fetchPage(1), 250);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const goToPage = useCallback((p: number) => void fetchPage(p), [fetchPage]);
  const refetch = useCallback(() => void fetchPage(page), [fetchPage, page]);

  return {
    reviews,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  };
}
