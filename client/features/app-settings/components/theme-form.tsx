"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ImagePickerField } from "@/features/media/components/image-picker-field";

import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";

const PRESETS = [
  "#FF006B",
  "#F97316",
  "#F59E0B",
  "#16A34A",
  "#0F766E",
  "#2563EB",
  "#7C3AED",
  "#1F2937",
];

export function ThemeForm() {
  const { values, set, save, loading, saving } = useSettingsGroup("theme");
  const color = values.primary_color || "#0F766E";

  const onSave = async () => {
    const ok = await save();
    toast(ok ? "Theme saved" : "Save failed", { tone: ok ? "success" : "error" });
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Branding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Logo and favicon for the admin panel. The storefront footer logo lives in Website
          Settings → Footer.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <ImagePickerField value={values.logo ?? ""} onChange={(u) => set("logo", u)} />
          </div>
          <div className="space-y-1.5">
            <Label>Favicon</Label>
            <ImagePickerField value={values.fav_icon ?? ""} onChange={(u) => set("fav_icon", u)} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Primary Color</h2>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => set("primary_color", e.target.value)}
            className="size-11 cursor-pointer rounded-lg border border-border bg-transparent"
            aria-label="Primary color"
          />
          <Input
            value={color}
            onChange={(e) => set("primary_color", e.target.value)}
            className="max-w-40 font-mono uppercase"
          />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Presets
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-label={p}
              onClick={() => set("primary_color", p)}
              style={{ backgroundColor: p }}
              className={cn(
                "size-7 rounded-full border transition-transform hover:scale-110",
                color.toLowerCase() === p.toLowerCase()
                  ? "ring-2 ring-brand ring-offset-2"
                  : "border-black/10",
              )}
            />
          ))}
        </div>

        <Button className="mt-5" onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} Save
        </Button>
      </Card>
    </div>
  );
}
