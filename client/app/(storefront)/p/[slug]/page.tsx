import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockList } from "@/features/website-builder/render/block-renderer";
import {
  buildPageMetadata,
  fetchPublishedServer,
} from "@/features/website-builder/server/published";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPublishedServer(slug);
  if (!page || !page.content) return { title: "Page not found" };
  return buildPageMetadata(page, page.title);
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchPublishedServer(slug);
  const blocks = page?.content?.blocks ?? [];

  // Unknown or unpublished (no visible content) → a real 404.
  if (!page || !page.content || blocks.length === 0) notFound();

  return (
    <div className="py-4">
      <BlockList blocks={blocks} />
    </div>
  );
}
