"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Row-selection state for a paginated table. Tracks a set of selected ids and
 * clears the selection whenever `resetKey` changes (pass your page/search/filter
 * deps) so a bulk action can never run against ids from a previous view.
 */
export function useTableSelection<T extends { id: string }>(items: T[], resetKey?: unknown) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [resetKey]);

  const pageIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = items.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (all) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [pageIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  return {
    ids: [...selected],
    count: selected.size,
    allSelected,
    isSelected: (id: string) => selected.has(id),
    toggleOne,
    toggleAll,
    clear,
  };
}
