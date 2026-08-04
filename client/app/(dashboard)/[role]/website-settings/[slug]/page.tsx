"use client";

import { Suspense, use } from "react";
import { PageWorkspace } from "@/features/website-builder/components/page-workspace";

export default function WebsitePageWorkspace({
  params,
}: {
  params: Promise<{ role: string; slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense fallback={null}>
      <PageWorkspace slug={slug} />
    </Suspense>
  );
}
