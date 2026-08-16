"use client";

import { useEffect, useState } from "react";
import { Eye, Globe, Layout, Loader2, PanelBottom, Rocket, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, slugify } from "@/lib/utils";
import { BlockCanvas } from "@/features/website-builder/components/block-canvas";
import { BlockPalette } from "@/features/website-builder/components/block-palette";
import { ConfigPanel, type PanelMode } from "@/features/website-builder/components/config-panel";
import { Preview } from "@/features/website-builder/components/preview";
import {
  fetchMenuOptions,
  fetchProductOptions,
} from "@/features/website-builder/services/storefront-menus";
import { fetchStorefrontCategories } from "@/features/storefront/services/storefront-catalog";
import { usePageBuilder } from "@/features/website-builder/hooks/use-page-builder";

export function BuilderShell({
  slug = "home",
  embedded = false,
}: {
  slug?: string;
  /** When embedded in the page workspace, drop the standalone page heading. */
  embedded?: boolean;
}) {
  const b = usePageBuilder(slug);
  const [panelMode, setPanelMode] = useState<PanelMode>("block");
  const [previewing, setPreviewing] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [menuOptions, setMenuOptions] = useState<{ value: string; label: string }[]>([]);
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    // Categories are per-branch (many "Starters"); dedupe by name-slug so each
    // appears once. The render resolves the slug to the selected branch's
    // category, so a picked category works on any branch.
    fetchStorefrontCategories()
      .then((cats) => {
        const seen = new Map<string, string>();
        for (const c of cats) {
          const s = slugify(c.name);
          if (s && !seen.has(s)) seen.set(s, c.name);
        }
        setCategoryOptions([...seen].map(([value, label]) => ({ value, label })));
      })
      .catch(() => setCategoryOptions([]));
    fetchMenuOptions()
      .then(setMenuOptions)
      .catch(() => setMenuOptions([]));
    fetchProductOptions()
      .then(setProductOptions)
      .catch(() => setProductOptions([]));
  }, []);

  const selectBlock = (id: string) => {
    b.setSelectedId(id);
    setPanelMode("block");
  };
  const selectedBlock = b.blocks.find((x) => x.id === b.selectedId) ?? null;

  if (b.loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr_360px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!embedded && (
            <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
              <Globe className="size-5 text-brand" /> Website Builder
            </h1>
          )}
          <p
            className={cn(
              embedded ? "text-sm" : "mt-0.5 text-sm",
              b.dirty || b.needsPublish ? "font-medium text-amber-600" : "text-muted-foreground",
            )}
          >
            {b.dirty
              ? "Unsaved changes"
              : b.needsPublish
                ? "Saved — publish to make changes live"
                : b.everPublished
                  ? "Published — live on your storefront"
                  : "Draft — not published yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewing(true)}>
            <Eye className="size-4" /> Preview
          </Button>
          <Button variant="secondary" size="sm" onClick={b.save} disabled={b.saving || !b.dirty}>
            {b.saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save draft
          </Button>
          <Button
            size="sm"
            onClick={b.publish}
            disabled={b.publishing}
            className={cn((b.dirty || b.needsPublish) && "ring-2 ring-brand/30 ring-offset-1")}
          >
            {b.publishing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Rocket className="size-4" />
            )}
            Publish{b.dirty || b.needsPublish ? " changes" : ""}
          </Button>
        </div>
      </div>

      {/* 3-column workspace */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr_360px]">
        {/* Left — palette + chrome */}
        <div className="space-y-4">
          <Card className="p-3">
            <BlockPalette onAdd={b.addBlock} />
          </Card>
          <Card className="p-3">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Site chrome
            </p>
            <ChromeButton
              active={panelMode === "header"}
              icon={Layout}
              label="Header"
              onClick={() => setPanelMode("header")}
            />
            <ChromeButton
              active={panelMode === "footer"}
              icon={PanelBottom}
              label="Footer"
              onClick={() => setPanelMode("footer")}
            />
          </Card>
        </div>

        {/* Middle — sortable sections */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Sections</p>
          <BlockCanvas
            blocks={b.blocks}
            selectedId={panelMode === "block" ? b.selectedId : null}
            onSelect={selectBlock}
            onToggleHidden={b.toggleHidden}
            onRemove={b.removeBlock}
            onMove={b.moveBlock}
          />
        </Card>

        {/* Right — config */}
        <Card className="p-4">
          <ConfigPanel
            mode={panelMode}
            block={selectedBlock}
            categoryOptions={categoryOptions}
            menuOptions={menuOptions}
            productOptions={productOptions}
            header={b.header}
            footer={b.footer}
            onBlockChange={b.updateConfig}
            onHeaderChange={b.updateHeader}
            onFooterChange={b.updateFooter}
          />
        </Card>
      </div>

      {previewing && (
        <Preview
          blocks={b.blocks}
          header={b.header}
          footer={b.footer}
          onClose={() => setPreviewing(false)}
        />
      )}
    </div>
  );
}

function ChromeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Layout;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand-tint/40 text-brand-deep"
          : "border-border text-ink hover:border-brand/40 hover:bg-secondary",
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-tint text-brand">
        <Icon className="size-4" />
      </span>
      {label}
    </button>
  );
}
