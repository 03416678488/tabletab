"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { HomeLanding } from "@/features/storefront/components/home-landing";
import { LandingSkeleton } from "@/features/storefront/components/landing-skeleton";
import type { Block } from "@/features/website-builder/schemas/blocks";
import { websiteService } from "@/features/website-builder/services/website.service";
import { useAutoGeolocate } from "@/hooks/use-auto-geolocate";
import { useBranchPicker } from "@/hooks/use-branch-picker";
import { useLocationStore } from "@/hooks/use-location-store";

/** Interactive storefront home. Rendered by the server home page (which owns metadata). */
export function HomeClient() {
  // Auto-detect the visitor's location → the landing resolves their nearest branch.
  useAutoGeolocate();

  // The persisted selection is only trustworthy after the store rehydrates.
  const hydrated = useSyncExternalStore(
    (cb) => useLocationStore.persist.onFinishHydration(cb),
    () => useLocationStore.persist.hasHydrated(),
    () => false,
  );
  // The branch picker dialog is mounted globally in the storefront header; open it via the shared store.
  const openPicker = useBranchPicker((s) => s.setOpen);

  // First landing: once the store has rehydrated, if the visitor hasn't chosen a
  // branch or shared location and the permission is still undecided, open the
  // pre-prompt so we ask for location before showing branch data. Returning
  // visitors (branch/coords persisted, or already confirmed) are never re-asked.
  const branchId = useLocationStore((s) => s.branchId);
  const coords = useLocationStore((s) => s.coords);
  const confirmed = useLocationStore((s) => s.confirmed);
  const geoStatus = useLocationStore((s) => s.geoStatus);
  useEffect(() => {
    if (hydrated && !confirmed && !branchId && !coords && geoStatus === "prompt") {
      openPicker(true);
    }
  }, [hydrated, confirmed, branchId, coords, geoStatus, openPicker]);

  // Published website-builder layout — replaces the default home once set.
  const [published, setPublished] = useState<Block[] | null | undefined>(undefined);
  useEffect(() => {
    let off = false;
    websiteService
      .getPublished("home")
      .then((page) => {
        if (off) return;
        const blocks = page.content?.blocks ?? [];
        setPublished(blocks.length ? blocks : null);
      })
      .catch(() => {
        if (!off) setPublished(null);
      });
    return () => {
      off = true;
    };
  }, []);

  // Avoid flashing the default home before we know whether a custom one exists.
  if (!hydrated || published === undefined) return <LandingSkeleton />;

  // Published custom blocks replace only the default body — the fulfillment tabs,
  // search, and filters stay intact. Branch context + change live in the header
  // strip; the picker dialog itself is mounted once in the header.
  return <HomeLanding onChangeBranch={() => openPicker(true)} publishedBlocks={published} />;
}
