import type { Metadata } from "next";

import { HomeClient } from "@/features/storefront/components/home-client";
import { fetchBrandNameServer } from "@/features/app-settings/server/brand";
import {
  buildPageMetadata,
  fetchPublishedServer,
} from "@/features/website-builder/server/published";

/** Feed the Home page's SEO tab (meta description, OG image, noindex) into the
 *  storefront home <head>. The tab title is the real business name (Settings →
 *  Company), so it's always the tenant's own brand — never a demo/placeholder. */
export async function generateMetadata(): Promise<Metadata> {
  const [page, brandName] = await Promise.all([
    fetchPublishedServer("home"),
    fetchBrandNameServer(),
  ]);
  const meta = buildPageMetadata(page, brandName ?? undefined);
  if (brandName) {
    meta.title = brandName;
    if (meta.openGraph) meta.openGraph.title = brandName;
    if (meta.twitter) meta.twitter.title = brandName;
  }
  return meta;
}

export default function HomePage() {
  return <HomeClient />;
}
