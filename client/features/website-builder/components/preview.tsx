"use client";

import { useState } from "react";
import { Monitor, Smartphone, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { BlockList } from "@/features/website-builder/render/block-renderer";
import { SiteFooterRender, SiteHeaderRender } from "@/features/website-builder/render/chrome";
import type { Block, FooterConfig, HeaderConfig } from "@/features/website-builder/schemas/blocks";

interface PreviewProps {
  blocks: Block[];
  header: HeaderConfig;
  footer: FooterConfig;
  onClose: () => void;
}

/** Full-screen live preview of the page as visitors will see it. */
export function Preview({ blocks, header, footer, onClose }: PreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
        <span className="text-sm font-semibold text-ink">Preview</span>
        <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
          <DeviceButton active={device === "desktop"} onClick={() => setDevice("desktop")}>
            <Monitor className="size-4" /> Desktop
          </DeviceButton>
          <DeviceButton active={device === "mobile"} onClick={() => setDevice("mobile")}>
            <Smartphone className="size-4" /> Mobile
          </DeviceButton>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-secondary"
        >
          <X className="size-4" /> Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-2xl bg-surface shadow-2xl transition-all",
            device === "mobile" ? "max-w-[390px]" : "max-w-full",
          )}
        >
          <SiteHeaderRender config={header} />
          <div className="py-4">
            {blocks.filter((b) => !b.hidden).length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">
                No visible sections yet.
              </p>
            ) : (
              <BlockList blocks={blocks} />
            )}
          </div>
          <SiteFooterRender config={footer} />
        </div>
      </div>
    </div>
  );
}

function DeviceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
