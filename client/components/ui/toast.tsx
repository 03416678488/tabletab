"use client";

import { Toaster as SonnerToaster } from "sonner";

export { toast } from "@/hooks/use-toast";

/**
 * App toaster — Sonner (shadcn's toast), styled to the app tokens: rounded card,
 * border, elevated shadow, tone-colored icons. Mount once (see app/layout.tsx).
 */
function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      gap={12}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!w-[380px] !max-w-[92vw] !rounded-2xl !border !border-border !bg-surface !text-ink !shadow-[var(--shadow-elevated)] !gap-3 !px-5 !py-4 !items-start",
          title: "!text-[15px] !font-semibold !text-ink",
          description: "!text-sm !text-muted-foreground",
          icon: "!mt-0.5 !size-5",
          success: "[&_[data-icon]]:!text-emerald-600",
          error: "[&_[data-icon]]:!text-red-600",
          info: "[&_[data-icon]]:!text-sky-600",
          closeButton:
            "!rounded-lg !border-border !bg-surface !text-muted-foreground hover:!bg-secondary hover:!text-ink",
        },
      }}
    />
  );
}

export { Toaster };
