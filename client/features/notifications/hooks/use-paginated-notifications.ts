"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { notificationService } from "@/features/notifications/services/notification.service";
import {
  NOTIF_CHANGED_EVENT,
} from "@/features/notifications/lib/notifications-client";
import type { AppNotification } from "@/features/notifications/types/notification.types";

interface Params {
  category?: string;
  status?: "unread" | "all";
  initialPerPage?: number;
}

/** Server-paginated notification history for the full-page view. */
export function usePaginatedNotifications({
  category,
  status,
  initialPerPage = 20,
}: Params = {}) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${category ?? ""}|${status ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await notificationService.list({
          page: p,
          perPage,
          category: category || undefined,
          status,
        });
        if (keyRef.current !== activeKey) return;
        setItems(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load notifications");
      } finally {
        if (keyRef.current === activeKey) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    void fetchPage(1);
  }, [fetchPage]);

  // Re-sync when read-state changes elsewhere (bell, board auto-read).
  useEffect(() => {
    const onChanged = () => void fetchPage(page);
    window.addEventListener(NOTIF_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(NOTIF_CHANGED_EVENT, onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, page]);

  const goToPage = useCallback((p: number) => void fetchPage(p), [fetchPage]);
  const refetch = useCallback(() => void fetchPage(page), [fetchPage, page]);

  return {
    items,
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
