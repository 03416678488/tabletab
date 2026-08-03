"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LayoutTemplate, Search, Settings, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import { BuilderShell } from "@/features/website-builder/components/builder-shell";
import { GeneralTab } from "@/features/website-builder/components/general-tab";
import { SeoTab } from "@/features/website-builder/components/seo-tab";
import { type WebsitePage, websiteService } from "@/features/website-builder/services/website.service";

type TabKey = "general" | "builder" | "seo";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "general", label: "General", icon: Settings },
  { key: "builder", label: "Page Builder", icon: LayoutTemplate },
  { key: "seo", label: "SEO", icon: Search },
];

const isTabKey = (v: string | null): v is TabKey => TABS.some((t) => t.key === v);

export function PageWorkspace({ slug }: { slug: string }) {
  const role = useParams<{ role: string }>().role;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The URL (?tab=…) is the source of truth, so tabs are shareable and the
  // browser back/forward buttons move between them.
  const tabParam = searchParams.get("tab");
  const tab: TabKey = isTabKey(tabParam) ? tabParam : "general";
  const setTab = (key: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [page, setPage] = useState<WebsitePage | null | undefined>(undefined);

  const load = useCallback(() => {
    websiteService
      .getPage(slug)
      .then(setPage)
      .catch(() => setPage(null));
  }, [slug]);
  useEffect(() => {
    load();
  }, [load]);

  if (page === undefined) {
    return (
      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (page === null) {
    return (
      <Card className="p-0">
        <EmptyState
          className="py-16"
          icon={Search}
          title="Page not found"
          description="This page may have been deleted."
        />
      </Card>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/${role}/website-settings`}
          className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
          aria-label="Back to pages"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold tracking-tight text-ink">
            {page.title}
          </h1>
          <p className="text-xs text-muted-foreground">/{page.slug}</p>
        </div>
        <StatusPill tone={page.published ? "green" : "neutral"} className="ml-auto">
          {page.published ? "Published" : "Draft"}
        </StatusPill>
      </div>

      {/* Side tabs + content */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors lg:w-full",
                  active
                    ? "border-brand bg-brand-tint/40 text-brand-deep"
                    : "border-border text-ink hover:border-brand/40 hover:bg-secondary",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {tab === "general" && <GeneralTab page={page} onChange={load} />}
          {tab === "builder" && <BuilderShell slug={page.slug} embedded />}
          {tab === "seo" && <SeoTab page={page} onChange={load} />}
        </div>
      </div>
    </div>
  );
}
