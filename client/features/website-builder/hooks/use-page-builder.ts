"use client";

import { useCallback, useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import { BLOCK_META } from "@/features/website-builder/constants/blocks";
import {
  type Block,
  type BlockType,
  type FooterConfig,
  type HeaderConfig,
  type PageContent,
  footerConfigSchema,
  headerConfigSchema,
  pageContentSchema,
} from "@/features/website-builder/schemas/blocks";
import { websiteService } from "@/features/website-builder/services/website.service";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b-${Math.random().toString(36).slice(2)}`;

/** Load, edit, save, and publish a single website page's content. */
export function usePageBuilder(slug: string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [everPublished, setEverPublished] = useState(false);
  // Saved to draft but not yet pushed to the published (live) snapshot. The
  // storefront only reads the published snapshot, so this drives the
  // "publish to go live" hint that stops saved edits looking already-live.
  const [needsPublish, setNeedsPublish] = useState(false);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [header, setHeader] = useState<HeaderConfig>(headerConfigSchema.parse({}));
  const [footer, setFooter] = useState<FooterConfig>(footerConfigSchema.parse({}));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      setLoading(true);
      try {
        const page = await websiteService.getPage(slug);
        if (off) return;
        const content = pageContentSchema.parse(page.content ?? {});
        setBlocks(content.blocks);
        setHeader(content.header);
        setFooter(content.footer);
        setEverPublished(Boolean(page.published));
        // A published page whose draft already diverges needs re-publishing.
        setNeedsPublish(
          Boolean(page.published) &&
            JSON.stringify(page.content) !== JSON.stringify(page.published),
        );
      } catch {
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [slug]);

  const markDirty = () => setDirty(true);

  const addBlock = useCallback((type: BlockType) => {
    const block: Block = {
      id: uid(),
      type,
      hidden: false,
      config: { ...BLOCK_META[type].defaultConfig },
    };
    setBlocks((b) => [...b, block]);
    setSelectedId(block.id);
    markDirty();
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((b) => b.filter((x) => x.id !== id));
    setSelectedId((s) => (s === id ? null : s));
    markDirty();
  }, []);

  const toggleHidden = useCallback((id: string) => {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, hidden: !x.hidden } : x)));
    markDirty();
  }, []);

  const updateConfig = useCallback((id: string, config: Record<string, unknown>) => {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, config } : x)));
    markDirty();
  }, []);

  const moveBlock = useCallback((fromId: string, toId: string) => {
    setBlocks((b) => {
      const from = b.findIndex((x) => x.id === fromId);
      const to = b.findIndex((x) => x.id === toId);
      if (from < 0 || to < 0 || from === to) return b;
      return arrayMove(b, from, to);
    });
    markDirty();
  }, []);

  const updateHeader = useCallback((h: HeaderConfig) => {
    setHeader(h);
    markDirty();
  }, []);
  const updateFooter = useCallback((f: FooterConfig) => {
    setFooter(f);
    markDirty();
  }, []);

  const content = (): PageContent => ({ blocks, header, footer });

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await websiteService.saveDraft(slug, content());
      setDirty(false);
      setNeedsPublish(true);
    } catch {
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, blocks, header, footer]);

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      await websiteService.saveDraft(slug, content());
      await websiteService.publish(slug);
      setDirty(false);
      setNeedsPublish(false);
      setEverPublished(true);
    } catch {
    } finally {
      setPublishing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, blocks, header, footer]);

  return {
    loading,
    saving,
    publishing,
    dirty,
    everPublished,
    needsPublish,
    blocks,
    header,
    footer,
    selectedId,
    setSelectedId,
    addBlock,
    removeBlock,
    toggleHidden,
    updateConfig,
    moveBlock,
    updateHeader,
    updateFooter,
    save,
    publish,
  };
}
