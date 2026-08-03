"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";

import { BLOCK_META } from "@/features/website-builder/constants/blocks";
import type { Block } from "@/features/website-builder/schemas/blocks";
import { cn } from "@/lib/utils";

interface BlockItemProps {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onRemove: () => void;
}

/** A draggable row in the block list. Click to edit; grip to reorder. */
export function BlockItem({ block, selected, onSelect, onToggleHidden, onRemove }: BlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-white p-2.5 shadow-sm transition-colors",
        selected ? "border-brand ring-1 ring-brand/30" : "border-border hover:border-brand/40",
        isDragging && "opacity-60",
        block.hidden && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{meta.label}</span>
          {block.hidden && (
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Hidden
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleHidden}
        aria-label={block.hidden ? "Show section" : "Hide section"}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
      >
        {block.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Delete section"
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
