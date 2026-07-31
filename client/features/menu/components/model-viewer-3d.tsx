"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ModelViewer3dProps {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ModelViewer3d({
  src,
  poster,
  alt,
  className,
  onLoad,
  onError,
}: ModelViewer3dProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [libReady, setLibReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setModelReady(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    void import("@google/model-viewer").then(() => {
      if (!cancelled) setLibReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !libReady) return;

    const handleLoad = () => {
      setModelReady(true);
      onLoad?.();
    };
    const handleError = () => {
      setFailed(true);
      onError?.();
    };

    el.addEventListener("load", handleLoad);
    el.addEventListener("error", handleError);
    return () => {
      el.removeEventListener("load", handleLoad);
      el.removeEventListener("error", handleError);
    };
  }, [libReady, src, onLoad, onError]);

  if (failed) {
    return null;
  }

  const showPoster = poster && (!libReady || !modelReady);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {showPoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      )}
      {(!libReady || !modelReady) && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-subtle/40 backdrop-blur-[1px]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <span className="relative z-[2] rounded-full bg-ink/70 px-3 py-1 text-[11px] font-medium text-white">
            Loading 3D model…
          </span>
        </div>
      )}
      {libReady && (
        <model-viewer
          ref={viewerRef as React.RefObject<HTMLElement>}
          src={src}
          poster={poster}
          alt={alt}
          camera-controls
          auto-rotate
          auto-rotate-delay="0"
          ar
          ar-modes="webxr scene-viewer quick-look"
          shadow-intensity="1"
          exposure="1"
          interaction-prompt="auto"
          touch-action="pan-y"
          className={cn(
            "block h-full w-full transition-opacity duration-300",
            modelReady ? "opacity-100" : "opacity-0",
          )}
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        />
      )}
    </div>
  );
}
