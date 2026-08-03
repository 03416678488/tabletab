"use client";

import { BLOCK_PALETTE, BLOCK_META } from "@/features/website-builder/constants/blocks";
import type { BlockType } from "@/features/website-builder/schemas/blocks";

export function BlockPalette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Add a section
      </p>
      {BLOCK_PALETTE.map((type) => {
        const meta = BLOCK_META[type];
        const Icon = meta.icon;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex w-full items-start gap-3 rounded-xl border border-border bg-white p-3 text-left transition-colors hover:border-brand/40 hover:bg-brand-tint/30"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{meta.label}</span>
              <span className="block text-xs leading-snug text-muted-foreground">
                {meta.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
