import type { Metadata } from "next";

import type { PageSeo } from "@/features/website-builder/schemas/blocks";
import type { PublishedPage } from "@/features/website-builder/services/website.service";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Server-side fetch of a page's published snapshot. Uses a plain fetch (not the
 * client `httpClient`, which pulls in next-auth/react) so it is safe to call
 * from server components and `generateMetadata`.
 */
export async function fetchPublishedServer(slug: string): Promise<PublishedPage | null> {
  try {
    const res = await fetch(`${API_BASE}/website/published/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as PublishedPage) ?? null;
  } catch {
    return null;
  }
}

/**
 * Build Next `Metadata` from a page's SEO fields. Empty fields are omitted so
 * the root layout's defaults still apply (pass `fallbackTitle` to override the
 * title when no meta title is set).
 */
export function buildPageMetadata(page: PublishedPage | null, fallbackTitle?: string): Metadata {
  const seo: Partial<PageSeo> = page?.seo ?? {};
  const title = seo.metaTitle?.trim() || fallbackTitle;
  const description = seo.metaDescription?.trim() || undefined;
  const images = seo.ogImage?.trim() ? [seo.ogImage.trim()] : undefined;

  const meta: Metadata = {};
  if (title) meta.title = title;
  if (description) meta.description = description;
  if (seo.noindex) meta.robots = { index: false, follow: false };
  if (title || description || images) {
    meta.openGraph = { title, description, images, type: "website" };
    meta.twitter = {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    };
  }
  return meta;
}
