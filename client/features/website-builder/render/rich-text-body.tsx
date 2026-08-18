"use client";

import { useSettings } from "@/features/app-settings/components/settings-provider";
import { resolveMergeVars } from "@/features/website-builder/constants/merge-vars";
import { cn } from "@/lib/utils";

/**
 * Renders authored rich-text HTML with `{{company.KEY}}` merge tokens resolved
 * from Settings → Business Info (live on both the storefront and the builder
 * preview). Client-only because it reads the settings context.
 */
export function RichTextBody({ html, className }: { html: string; className?: string }) {
  const { get } = useSettings();
  return (
    <div
      className={cn("rich-text", className)}
      // Authored by staff in the builder's WYSIWYG editor (trusted source).
      dangerouslySetInnerHTML={{ __html: resolveMergeVars(html, get) }}
    />
  );
}
