"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmblaSliderProps {
  children: React.ReactNode[];
  /** Tailwind basis for each slide (controls how many show at once). */
  slideClassName?: string;
  autoplayMs?: number;
  className?: string;
  /**
   * Stretch the track and slides to the wrapper's height (set a height via
   * `className`). Slides then fill that height instead of using their own aspect.
   */
  fill?: boolean;
  /** Show the prev/next arrow buttons (the dot pagination is unaffected). */
  showArrows?: boolean;
}

/**
 * Thin wrapper around Embla — arrows, dots, optional autoplay. Kept dependency-
 * light (no autoplay plugin) so it works the same in the editor and storefront.
 */
export function EmblaSlider({
  children,
  slideClassName = "basis-full",
  autoplayMs,
  className,
  fill = false,
  showArrows = true,
}: EmblaSliderProps) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  useEffect(() => {
    if (!embla || !autoplayMs) return;
    const id = setInterval(() => embla.scrollNext(), autoplayMs);
    return () => clearInterval(id);
  }, [embla, autoplayMs]);

  return (
    <div className={cn("relative", className)}>
      <div className={cn("overflow-hidden", fill && "h-full")} ref={emblaRef}>
        {/* Spacing via per-slide left padding (not flex `gap`) so the gap is
            consistent at the loop boundary too, and the `-ml-4` pulls the first
            slide flush with the container's left edge — the last slide's right
            edge lines up with the container's right edge. */}
        <div className={cn("flex -ml-4", fill && "h-full")}>
          {children.map((child, i) => (
            <div
              key={i}
              className={cn("min-w-0 shrink-0 grow-0 pl-4", fill && "h-full", slideClassName)}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {children.length > 1 && (
        <>
          {showArrows && (
            <>
              <button
                type="button"
                onClick={() => embla?.scrollPrev()}
                aria-label="Previous"
                className="absolute -left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-[var(--shadow-elevated)] transition-colors hover:bg-secondary sm:flex"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => embla?.scrollNext()}
                aria-label="Next"
                className="absolute -right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-[var(--shadow-elevated)] transition-colors hover:bg-secondary sm:flex"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          <div className="mt-3 flex justify-center gap-1.5">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => embla?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === selected ? "w-5 bg-brand" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
