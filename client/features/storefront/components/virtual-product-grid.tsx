"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ProductCard } from "@/features/storefront/components/product-card";
import type { MenuItem } from "@/lib/types";

/** Column count per breakpoint — must match the inline grid so slicing lines up. */
function columnsFor(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

/**
 * Window-scrolled, row-virtualized product grid: only the visible rows are in the
 * DOM, so thousands of items stay smooth. Rows are measured (not fixed-height) so
 * card/description height differences don't drift. Infinite loading is driven by a
 * sentinel in the parent (below this grid), not from here.
 */
export function VirtualProductGrid({ items }: { items: MenuItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(2);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Track container width → column count, and its offset from the document top
  // (the grid sits below the hero/toolbar, which the window virtualizer needs).
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const measure = () => {
      setCols(columnsFor(el.clientWidth));
      setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const rowCount = Math.ceil(items.length / cols);
  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 300,
    overscan: 4,
    gap: 16,
    scrollMargin,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="w-full">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualRows.map((row) => {
          const start = row.index * cols;
          const rowItems = items.slice(start, start + cols);
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: 16,
                paddingBottom: 16,
              }}
            >
              {rowItems.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
