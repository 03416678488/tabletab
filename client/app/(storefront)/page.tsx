"use client";

import { useState, useSyncExternalStore } from "react";
import { HomeLanding } from "@/features/storefront/components/home-landing";
import { LocationPermissionDialog } from "@/features/storefront/components/location-permission-dialog";
import { useLocationStore } from "@/hooks/use-location-store";

export default function HomePage() {
  const confirmed = useLocationStore((s) => s.confirmed);
  // The persisted selection is only trustworthy after the store rehydrates.
  const hydrated = useSyncExternalStore(
    (cb) => useLocationStore.persist.onFinishHydration(cb),
    () => useLocationStore.persist.hasHydrated(),
    () => false,
  );
  const [askOpen, setAskOpen] = useState(false);

  if (!hydrated) return <div className="min-h-[70vh]" />;

  return (
    <>
      <HomeLanding onChangeBranch={() => setAskOpen(true)} />
      {/* Auto-asks on first visit; re-openable via the landing's location control. */}
      <LocationPermissionDialog open={askOpen || !confirmed} onOpenChange={setAskOpen} />
    </>
  );
}
