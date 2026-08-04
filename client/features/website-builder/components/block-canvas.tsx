"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutList } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { BlockItem } from "@/features/website-builder/components/block-item";
import type { Block } from "@/features/website-builder/schemas/blocks";

interface BlockCanvasProps {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (fromId: string, toId: string) => void;
}

/** The ordered, drag-sortable list of the page's sections. */
export function BlockCanvas({
  blocks,
  selectedId,
  onSelect,
  onToggleHidden,
  onRemove,
  onMove,
}: BlockCanvasProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  if (blocks.length === 0) {
    return (
      <EmptyState
        className="rounded-2xl border border-dashed border-border py-16"
        icon={LayoutList}
        title="No sections yet"
        description="Add a section from the left to start building your landing page."
      />
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              selected={block.id === selectedId}
              onSelect={() => onSelect(block.id)}
              onToggleHidden={() => onToggleHidden(block.id)}
              onRemove={() => onRemove(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
