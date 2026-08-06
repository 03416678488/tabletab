"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination over an already-loaded array. Use for small config
 * lists where the backend returns the full set (currencies, taxes, time slots…)
 * so the paginated UI stays consistent with the server-paginated managers.
 *
 * Pass an already-filtered array; when it shrinks below the current page the
 * hook clamps back into range automatically.
 */
export function useClientPagination<T>(items: T[], initialPerPage = 15) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page, perPage],
  );

  return { page, setPage, perPage, setPerPage, totalPages, totalItems, pageItems };
}
