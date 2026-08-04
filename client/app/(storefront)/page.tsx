import type { Metadata } from "next";

import { HomeClient } from "@/features/storefront/components/home-client";
import {
  buildPageMetadata,
  fetchPublishedServer,
} from "@/features/website-builder/server/published";

/** Feed the Home page's SEO tab (meta title/description, OG image, noindex) into
 *  the storefront home <head>. Empty fields fall back to the root layout defaults. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublishedServer("home");
  return buildPageMetadata(page);
}

export default function HomePage() {
  return <HomeClient />;
}
