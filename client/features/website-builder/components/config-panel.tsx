"use client";

import { MousePointerClick } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { FooterConfigForm, HeaderConfigForm } from "@/features/website-builder/components/chrome-forms";
import { BLOCK_META } from "@/features/website-builder/constants/blocks";
import { BLOCK_REGISTRY } from "@/features/website-builder/constants/registry";
import type { Block, FooterConfig, HeaderConfig } from "@/features/website-builder/schemas/blocks";

export type PanelMode = "block" | "header" | "footer";

interface ConfigPanelProps {
  mode: PanelMode;
  block: Block | null;
  categoryOptions: { value: string; label: string }[];
  menuOptions: { value: string; label: string }[];
  productOptions: { value: string; label: string }[];
  header: HeaderConfig;
  footer: FooterConfig;
  onBlockChange: (id: string, config: Record<string, unknown>) => void;
  onHeaderChange: (h: HeaderConfig) => void;
  onFooterChange: (f: FooterConfig) => void;
}

export function ConfigPanel({
  mode,
  block,
  categoryOptions,
  menuOptions,
  productOptions,
  header,
  footer,
  onBlockChange,
  onHeaderChange,
  onFooterChange,
}: ConfigPanelProps) {
  if (mode === "header") {
    return (
      <PanelBody title="Header">
        <HeaderConfigForm config={header} onChange={onHeaderChange} />
      </PanelBody>
    );
  }
  if (mode === "footer") {
    return (
      <PanelBody title="Footer">
        <FooterConfigForm config={footer} onChange={onFooterChange} />
      </PanelBody>
    );
  }
  if (!block) {
    return (
      <EmptyState
        className="py-16"
        icon={MousePointerClick}
        title="Nothing selected"
        description="Pick a section on the left to edit its content."
      />
    );
  }
  const entry = BLOCK_REGISTRY[block.type];
  const ConfigForm = entry.ConfigForm;
  return (
    <PanelBody title={BLOCK_META[block.type].label}>
      {/* key forces a fresh form when switching between blocks of the same type */}
      <ConfigForm
        key={block.id}
        config={block.config}
        onChange={(c) => onBlockChange(block.id, c)}
        categoryOptions={categoryOptions}
        menuOptions={menuOptions}
        productOptions={productOptions}
      />
    </PanelBody>
  );
}

function PanelBody({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}
