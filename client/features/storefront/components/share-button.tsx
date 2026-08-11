"use client";

import { Share2 } from "lucide-react";
import { flash } from "@/features/storefront/hooks/use-storefront-flash";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** App-relative path to share, e.g. `/menu/item/abc`. Resolved to an absolute URL. */
  path: string;
  title: string;
  /** Optional descriptive text for the native share sheet. */
  text?: string;
  /** Optional visible label next to the icon. */
  label?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Shares a link to a storefront item. Uses the native share sheet where
 * available (mobile), and falls back to copying the link to the clipboard.
 */
export function ShareButton({ path, title, text, label, ariaLabel, className }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    // Cards/links may wrap this — don't trigger their navigation.
    e.preventDefault();
    e.stopPropagation();

    const url =
      typeof window !== "undefined" ? new URL(path, window.location.origin).toString() : path;

    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title, text, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }

    try {
      await nav?.clipboard?.writeText(url);
      flash("Link copied to clipboard", { tone: "success" });
    } catch {
      flash("Couldn't copy the link", { tone: "error" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={ariaLabel ?? `Share ${title}`}
      className={cn("inline-flex items-center justify-center gap-1.5", className)}
    >
      <Share2 className="size-4" />
      {label}
    </button>
  );
}
