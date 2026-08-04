"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { FooterConfig, HeaderConfig } from "@/features/website-builder/schemas/blocks";
import { websiteService } from "@/features/website-builder/services/website.service";

interface SiteChrome {
  header: HeaderConfig | null;
  footer: FooterConfig | null;
}

const SiteChromeContext = createContext<SiteChrome>({ header: null, footer: null });

/**
 * Fetches the published home page's header/footer config once and exposes it to
 * the storefront chrome. Null fields mean "use the built-in defaults", so an
 * unpublished site keeps its original header and footer.
 */
export function SiteChromeProvider({ children }: { children: React.ReactNode }) {
  const [chrome, setChrome] = useState<SiteChrome>({ header: null, footer: null });

  useEffect(() => {
    let off = false;
    websiteService
      .getPublished("home")
      .then((page) => {
        if (off || !page.content) return;
        setChrome({ header: page.content.header ?? null, footer: page.content.footer ?? null });
      })
      .catch(() => {
        /* no published chrome — keep defaults */
      });
    return () => {
      off = true;
    };
  }, []);

  return <SiteChromeContext.Provider value={chrome}>{children}</SiteChromeContext.Provider>;
}

export const useSiteHeaderConfig = () => useContext(SiteChromeContext).header;
export const useSiteFooterConfig = () => useContext(SiteChromeContext).footer;
