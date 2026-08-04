"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff, type LucideIcon } from "lucide-react";

import { cn, isLocalUpload } from "@/lib/utils";

type AppImageProps = Omit<ImageProps, "src" | "onError"> & {
  /** Image URL. Empty/null → the placeholder is shown. */
  src?: string | null;
  /** Icon shown in the placeholder (defaults to a generic image icon). */
  fallbackIcon?: LucideIcon;
  /** Extra classes for the placeholder box. */
  fallbackClassName?: string;
};

/**
 * App-wide image with a graceful fallback placeholder (missing src or load
 * error) and automatic `unoptimized` handling for locally-served uploads (the
 * Next optimizer refuses localhost hosts). Drop-in for `next/image`.
 */
export function AppImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  fallbackIcon: FallbackIcon = ImageOff,
  fallbackClassName,
  ...rest
}: AppImageProps) {
  const [failed, setFailed] = useState(false);
  // Reset the error state if the src changes (e.g. list re-renders).
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        style={fill ? undefined : { width, height }}
        className={cn(
          "flex items-center justify-center bg-subtle text-muted-foreground",
          fill && "absolute inset-0 size-full",
          className,
          fallbackClassName,
        )}
      >
        <FallbackIcon className="size-6 opacity-40" aria-hidden />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      unoptimized={isLocalUpload(src)}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
