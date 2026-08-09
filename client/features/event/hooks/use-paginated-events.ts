"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { eventService } from "@/features/event/services/event.service";
import type { EventBooking, EventStatus } from "@/features/event/types/event.types";

interface Params {
  search?: string;
  branchId?: string;
  status?: EventStatus;
  date?: string;
}

/** Server-paginated event bookings for the management table. */
export function usePaginatedEvents({ search, branchId, status, date }: Params = {}) {
  const [events, setEvents] = useState<EventBooking[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${search ?? ""}|${branchId ?? ""}|${status ?? ""}|${date ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await eventService.list({
          page: p,
          perPage,
          search: search || undefined,
          branchId: branchId || undefined,
          status,
          date: date || undefined,
        });
        if (keyRef.current !== activeKey) return;
        setEvents(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load event bookings");
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
    events,
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
