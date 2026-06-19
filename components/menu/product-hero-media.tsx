"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Box } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenuDisplayMode } from "@/hooks/use-tenant";
import { shouldShow3dModel } from "@/lib/menu-display";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const ModelViewer3d = dynamic(
  () => import("@/components/menu/model-viewer-3d").then((m) => m.ModelViewer3d),
  {
    ssr: false,
    loading: () => <Skeleton className="absolute inset-0 h-full w-full" />,
  },
);

interface ProductHeroMediaProps {
  item: MenuItem;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  /** Overlay gradient for text legibility (venue full-screen view). */
  showGradient?: boolean;
}

export function ProductHeroMedia({
  item,
  className,
  imageClassName,
  priority,
  sizes = "100vw",
  showGradient = false,
}: ProductHeroMediaProps) {
  const mode = useMenuDisplayMode();
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    setModelFailed(false);
  }, [item.id, item.model3dUrl, mode]);

  const wants3d = shouldShow3dModel(mode, item);
  const use3d = wants3d && !modelFailed;

  return (
    <div className={cn("relative overflow-hidden bg-subtle", className)}>
      {use3d ? (
        <>
          <ModelViewer3d
            src={item.model3dUrl!}
            poster={item.imageUrl}
            alt={item.name}
            className="absolute inset-0"
            onError={() => setModelFailed(true)}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[2] flex items-center gap-1.5 rounded-full bg-ink/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
            <Box className="size-3" aria-hidden />
            Drag to rotate · Pinch to zoom
          </div>
        </>
      ) : (
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className={cn("object-cover", imageClassName)}
          priority={priority}
          sizes={sizes}
        />
      )}
      {showGradient && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-ink/50 via-transparent to-ink/20" />
      )}
    </div>
  );
}
