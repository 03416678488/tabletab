"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFlashStore, type FlashTone } from "@/features/storefront/hooks/use-storefront-flash";

const TONE: Record<FlashTone, { icon: typeof Info; box: string; icon_: string }> = {
  default: { icon: Info, box: "border-border bg-surface text-ink", icon_: "text-brand-deep" },
  success: {
    icon: CheckCircle2,
    box: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon_: "text-emerald-600",
  },
  error: {
    icon: TriangleAlert,
    box: "border-red-200 bg-red-50 text-red-900",
    icon_: "text-red-600",
  },
  info: { icon: Info, box: "border-sky-200 bg-sky-50 text-sky-900", icon_: "text-sky-600" },
};

function FlashItem({
  id,
  title,
  description,
  tone,
}: {
  id: string;
  title: string;
  description?: string;
  tone: FlashTone;
}) {
  const dismiss = useFlashStore((s) => s.dismiss);
  const meta = TONE[tone];
  const Icon = meta.icon;

  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 4000);
    return () => clearTimeout(t);
  }, [id, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-card)] duration-200 animate-in fade-in slide-in-from-top-2",
        meta.box,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", meta.icon_)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-0.5 text-sm opacity-80">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(id)}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/**
 * Storefront inline messages — a centered banner pinned just under the header
 * (not a corner toast). Mounted once in the storefront layout.
 */
export function StorefrontFlash() {
  const messages = useFlashStore((s) => s.messages);
  if (messages.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[100] mx-auto flex w-full max-w-md flex-col gap-2 px-4">
      {messages.map((m) => (
        <FlashItem key={m.id} {...m} />
      ))}
    </div>
  );
}
