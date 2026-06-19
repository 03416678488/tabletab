"use client";

import Link from "next/link";
import { Box, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { toast } from "@/hooks/use-toast";
import type { MenuDisplayMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: {
  value: MenuDisplayMode;
  label: string;
  description: string;
  icon: typeof ImageIcon;
}[] = [
  {
    value: "simple",
    label: "Simple",
    description: "Photo-only menu — fast to load on any device.",
    icon: ImageIcon,
  },
  {
    value: "3d",
    label: "3D",
    description: "Interactive 3D models on the product screen when available.",
    icon: Box,
  },
];

export function MenuDisplaySettings() {
  const mode = useSettingsStore((s) => s.tenant.menuDisplayMode ?? "simple");
  const updateTenant = useSettingsStore((s) => s.updateTenant);

  const handleSelect = (next: MenuDisplayMode) => {
    if (next === mode) return;
    updateTenant({ menuDisplayMode: next });
    toast(
      next === "3d"
        ? "3D menu mode enabled"
        : "Simple photo menu mode enabled",
      { tone: "success" },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Box className="size-5 text-brand" />
        <CardTitle className="font-display text-base">Menu display</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose how dishes appear on your online menu and in-venue QR ordering.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((option) => {
            const Icon = option.icon;
            const selected = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors",
                  selected
                    ? "border-brand bg-brand-tint ring-2 ring-brand/20"
                    : "border-border hover:border-brand/30 hover:bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    selected ? "bg-brand text-primary-foreground" : "bg-subtle text-brand-deep",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-sm font-semibold text-ink">{option.label}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="rounded-xl border border-border bg-subtle px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <strong className="font-medium text-ink">3D mode</strong> needs a{" "}
          <code className="text-ink">.glb</code> model uploaded per item in{" "}
          <Link href="/app/menu" className="font-medium text-brand hover:underline">
            Menu
          </Link>
          . Items without a model automatically fall back to their photo.
        </p>
      </CardContent>
    </Card>
  );
}
