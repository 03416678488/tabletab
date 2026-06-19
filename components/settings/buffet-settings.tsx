"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useBuffetStore } from "@/hooks/use-buffet-store";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BuffetPackage } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function BuffetSettings() {
  const hydrated = useBuffetStore((s) => s.hydrated);
  const packages = useBuffetStore((s) => s.packages);
  const upsertPackage = useBuffetStore((s) => s.upsertPackage);
  const [remote, setRemote] = useState<BuffetPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBuffetPackages().then((list) => {
      setRemote(list);
      setLoading(false);
    });
  }, [packages]);

  const list = hydrated ? packages : remote;

  const toggleActive = async (pkg: BuffetPackage) => {
    const updated = { ...pkg, isActive: !pkg.isActive };
    upsertPackage(updated);
    await api.upsertBuffetPackage(updated);
    toast(updated.isActive ? "Buffet enabled" : "Buffet disabled", { tone: "success" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <UtensilsCrossed className="size-5 text-brand" />
        <div>
          <CardTitle className="font-display text-base">Buffet packages</CardTitle>
          <p className="text-sm text-muted-foreground">
            Per-head dining with availability windows. Priced by covers, not individual dishes.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <ul className="space-y-3">
            {list.map((pkg) => (
              <li
                key={pkg.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-subtle/40 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{pkg.name}</p>
                    <StatusPill tone={pkg.isActive ? "green" : "neutral"} dot={false}>
                      {pkg.isActive ? "Active" : "Off"}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {pkg.availability.days.join(", ")} · {pkg.availability.startTime}–
                    {pkg.availability.endTime}
                    {pkg.branchId ? " · Branch-specific" : " · All branches"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {pkg.tiers?.length
                      ? pkg.tiers.map((t) => `${t.label} ${formatCurrency(t.price)}`).join(" · ")
                      : `${formatCurrency(pkg.pricePerPerson ?? 0)} / person`}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleActive(pkg)}>
                  {pkg.isActive ? "Disable" : "Enable"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Buffet orders appear in the kitchen as cover counts for replenishment. Only à la carte
          extras generate individual kitchen tickets.
        </p>
      </CardContent>
    </Card>
  );
}
