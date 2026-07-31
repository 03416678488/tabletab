"use client";

import { cn } from "@/lib/utils";

interface PhonePreviewFrameProps {
  children: React.ReactNode;
  className?: string;
}

/** Phone-framed preview for branding settings. */
export function PhonePreviewFrame({ children, className }: PhonePreviewFrameProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[280px]", className)}>
      <div className="rounded-[2rem] border-[10px] border-ink/90 bg-ink/90 p-1 shadow-[var(--shadow-elevated)]">
        <div className="overflow-hidden rounded-[1.4rem] bg-subtle">
          <div className="flex items-center justify-center gap-1 bg-ink/90 py-1.5">
            <div className="size-2 rounded-full bg-ink/40" />
            <div className="h-1.5 w-12 rounded-full bg-ink/30" />
          </div>
          <div className="max-h-[420px] overflow-y-auto">{children}</div>
          <div className="flex justify-center bg-ink/90 py-2">
            <div className="h-1 w-24 rounded-full bg-ink/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
