import { httpClient } from "@/lib/httpClient";
import type { PageContent, PageSeo } from "@/features/website-builder/schemas/blocks";

export interface WebsitePage {
  id: string;
  slug: string;
  title: string;
  content: PageContent;
  published: PageContent | null;
  publishedAt: string | null;
  seo: PageSeo;
}

export interface PageSummary {
  id: string;
  slug: string;
  title: string;
  isHome: boolean;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface PublishedPage {
  slug: string;
  title: string;
  content: PageContent | null;
  seo: PageSeo;
}

export const websiteService = {
  /** All pages, for the management listing. Requires auth. */
  list: () =>
    httpClient.get<PageSummary[]>(`/website/pages`, { auth: true }).then((r) => r.data),

  create: (title: string, slug: string) =>
    httpClient
      .post<WebsitePage>(`/website/pages`, { title, slug }, { auth: true })
      .then((r) => r.data),

  /** Editor read — includes draft + published + seo. Requires auth. */
  getPage: (slug: string) =>
    httpClient.get<WebsitePage>(`/website/pages/${slug}`, { auth: true }).then((r) => r.data),

  saveDraft: (slug: string, content: PageContent, title?: string) =>
    httpClient
      .put<WebsitePage>(`/website/pages/${slug}/draft`, { content, title }, { auth: true })
      .then((r) => r.data),

  updateGeneral: (slug: string, data: { title?: string; slug?: string }) =>
    httpClient
      .put<WebsitePage>(`/website/pages/${slug}/general`, data, { auth: true })
      .then((r) => r.data),

  updateSeo: (slug: string, seo: PageSeo) =>
    httpClient.put<WebsitePage>(`/website/pages/${slug}/seo`, seo, { auth: true }).then((r) => r.data),

  publish: (slug: string) =>
    httpClient
      .post<WebsitePage>(`/website/pages/${slug}/publish`, undefined, { auth: true })
      .then((r) => r.data),

  remove: (slug: string) =>
    httpClient
      .delete<{ message: string }>(`/website/pages/${slug}`, { auth: true })
      .then((r) => r.data),

  /** Public storefront read — published snapshot only. */
  getPublished: (slug: string) =>
    httpClient.get<PublishedPage>(`/website/published/${slug}`).then((r) => r.data),
};
