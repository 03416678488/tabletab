"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional total-item count shown on the left. */
  totalItems?: number;
  /** Current page size — pass with `onPerPageChange` to show the size selector. */
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
}

const DEFAULT_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

/** Windowed page list: 1 … p-1 p p+1 … last (no gaps of exactly 1). */
function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  const wanted = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

/** Reusable numbered pagination control for server-paginated lists. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  perPage,
  onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  className,
}: PaginationProps) {
  const showSizeSelector = Boolean(onPerPageChange && perPage !== undefined);

  // Nothing to page through — but still show the size selector (so the user can
  // shrink the page) and/or the count.
  if (totalPages <= 1 && !showSizeSelector) {
    return totalItems !== undefined && totalItems > 0 ? (
      <p className={cn("px-1 text-sm text-muted-foreground", className)}>{totalItems} total</p>
    ) : null;
  }

  const sizeSelector = showSizeSelector && (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      Rows
      <Dropdown
        value={String(perPage)}
        onChange={(v) => onPerPageChange!(Number(v))}
        aria-label="Rows per page"
        className="w-24"
        options={perPageOptions.map((n) => ({ value: String(n), label: String(n) }))}
      />
    </div>
  );

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        {sizeSelector}
        {totalItems !== undefined && (
          <p className="text-sm text-muted-foreground">{totalItems} total</p>
        )}
      </div>
      {totalPages <= 1 ? null : (
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e${i}`} className="px-1.5 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
