"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

/**
 * Product image gallery: a main 1-up slider synced with a 4-up thumbnail strip.
 * Selecting a thumbnail scrolls the main slider; swiping the main slider moves
 * the thumbnail highlight. Falls back to a single static image when there's ≤1.
 */
export function ProductGallery({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const [mainRef, mainApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
    align: "start",
  });
  const [selected, setSelected] = useState(0);

  const onThumbClick = useCallback((i: number) => mainApi?.scrollTo(i), [mainApi]);

  const onSelect = useCallback(() => {
    if (!mainApi) return;
    const idx = mainApi.selectedScrollSnap();
    setSelected(idx);
    thumbApi?.scrollTo(idx);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
    onSelect();
    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, onSelect]);

  // Single image → no sliders, just the framed picture.
  if (images.length <= 1) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl bg-subtle", className)}>
        <AppImage src={images[0] ?? ""} alt={alt} fill className="object-cover" sizes="100vw" />
      </div>
    );
  }

  return (
    <div>
      {/* Main slider */}
      <div className="overflow-hidden rounded-2xl bg-subtle" ref={mainRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div
              key={i}
              className={cn(
                "relative min-w-0 flex-[0_0_100%]",
                className ?? "aspect-square",
              )}
            >
              <AppImage
                src={src}
                alt={`${alt} — image ${i + 1}`}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 512px"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnail strip (4-up) synced with the main slider */}
      <div className="mt-3 overflow-hidden" ref={thumbRef}>
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onThumbClick(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={selected === i}
              className={cn(
                "relative aspect-square min-w-0 basis-1/4 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                selected === i
                  ? "border-brand"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <AppImage src={src} alt="" fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
