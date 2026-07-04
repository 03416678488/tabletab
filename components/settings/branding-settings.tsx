"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ImageIcon, Palette, RotateCcw, X } from "lucide-react";
import { ThemeProvider } from "@/components/brand/theme-provider";
import { PhonePreviewFrame } from "@/components/brand/phone-preview-frame";
import { TenantLogo } from "@/components/brand/tenant-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { toast } from "@/hooks/use-toast";
import { brandingKey, DEFAULT_BRANDING, normalizeHex, resolveBranding } from "@/lib/theme";
import type { TenantBranding } from "@/lib/types";

const MAX_LOGO_BYTES = 512_000;

export function BrandingSettings() {
  const savedKey = useSettingsStore((s) => brandingKey(s.tenant.branding ?? {}));
  const setBranding = useSettingsStore((s) => s.setBranding);
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<TenantBranding>(() =>
    resolveBranding(useSettingsStore.getState().tenant.branding),
  );
  const [saving, setSaving] = useState(false);
  const savedBranding = useMemo(
    () => resolveBranding(useSettingsStore.getState().tenant.branding),
    [savedKey],
  );

  useEffect(() => {
    setDraft(resolveBranding(useSettingsStore.getState().tenant.branding));
  }, [savedKey]);

  const previewBranding = useMemo(() => resolveBranding(draft), [draft]);
  const isDirty = brandingKey(draft) !== brandingKey(savedBranding);

  const patchDraft = (patch: Partial<TenantBranding>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file", { tone: "error" });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast("Logo must be under 500 KB", { tone: "error" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        patchDraft({ logoDataUrl: result, logoUrl: undefined });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resolved = resolveBranding(draft);
      setBranding(resolved);
      setDraft(resolved);
      window.dispatchEvent(new CustomEvent("tabletap-branding-saved", { detail: resolved }));
      toast("Branding saved — open your storefront or QR menu to see the new theme", {
        tone: "success",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDraft = () => {
    setDraft({ ...DEFAULT_BRANDING });
  };

  const handleDiscard = () => {
    setDraft(savedBranding);
  };

  const primaryForPicker = normalizePickerColor(draft.primaryColor, DEFAULT_BRANDING.primaryColor);
  const accentForPicker = normalizePickerColor(
    draft.accentColor,
    DEFAULT_BRANDING.accentColor ?? "#F59E0B",
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Palette className="size-5 text-brand" />
        <CardTitle className="font-display text-base">Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Customize colors and logo for your online storefront and in-venue QR ordering.
          Changes apply after you click <strong className="font-medium text-ink">Save branding</strong>.
          Staff dashboards keep TableTap branding.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand-primary">Primary color</Label>
            <div className="flex gap-2">
              <Input
                id="brand-primary"
                type="color"
                value={primaryForPicker}
                onChange={(e) => patchDraft({ primaryColor: e.target.value })}
                className="h-10 w-14 shrink-0 cursor-pointer p-1"
              />
              <Input
                value={draft.primaryColor ?? ""}
                onChange={(e) => patchDraft({ primaryColor: e.target.value })}
                placeholder={DEFAULT_BRANDING.primaryColor}
                className="font-mono text-sm uppercase"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to use default {DEFAULT_BRANDING.primaryColor}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-accent">Accent color</Label>
            <div className="flex gap-2">
              <Input
                id="brand-accent"
                type="color"
                value={accentForPicker}
                onChange={(e) => patchDraft({ accentColor: e.target.value })}
                className="h-10 w-14 shrink-0 cursor-pointer p-1"
              />
              <Input
                value={draft.accentColor ?? ""}
                onChange={(e) => patchDraft({ accentColor: e.target.value })}
                placeholder={DEFAULT_BRANDING.accentColor}
                className="font-mono text-sm uppercase"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to use default {DEFAULT_BRANDING.accentColor}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <p className="text-xs text-muted-foreground">
            Optional. Without a logo, customers see your restaurant name with a default icon.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                handleLogoUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <ImageIcon className="size-4" />
              Upload logo
            </Button>
            {(draft.logoDataUrl || draft.logoUrl) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => patchDraft({ logoDataUrl: undefined, logoUrl: undefined })}
              >
                <X className="size-4" />
                Remove logo
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-logo-url" className="text-muted-foreground">
              Or logo URL
            </Label>
            <Input
              id="brand-logo-url"
              value={draft.logoUrl ?? ""}
              onChange={(e) =>
                patchDraft({
                  logoUrl: e.target.value,
                  logoDataUrl: e.target.value.trim() ? undefined : draft.logoDataUrl,
                })
              }
              placeholder="https://…"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-subtle p-4">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview (unsaved)
          </p>
          <PhonePreviewFrame>
            <ThemeProvider branding={previewBranding} className="min-h-[380px] bg-subtle">
              <div className="border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm">
                <TenantLogo showTagline branding={previewBranding} variant="compact" />
              </div>
              <div className="space-y-3 p-4">
                <div className="rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]">
                  <p className="font-display text-sm font-semibold text-ink">Menu item</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Fresh ingredients, house-made</p>
                  <p className="mt-2 text-sm font-semibold text-brand">$14.00</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    Primary button
                  </span>
                  <span className="rounded-full bg-brand-tint px-3 py-1.5 text-xs font-medium text-brand-deep">
                    Brand tint
                  </span>
                  <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                    Accent
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-primary-foreground shadow-sm"
                >
                  Add to cart
                </button>
              </div>
            </ThemeProvider>
          </PhonePreviewFrame>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleResetDraft}>
            <RotateCcw className="size-4" />
            Use defaults
          </Button>
          {isDirty && (
            <Button type="button" variant="ghost" size="sm" onClick={handleDiscard}>
              Discard changes
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isDirty && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
          <Button type="button" disabled={!isDirty || saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save branding"}
          </Button>
        </div>
      </CardFooter>

      <div className="border-t border-border px-6 pb-6 pt-2">
        <p className="text-xs text-muted-foreground">
          After saving, open{" "}
          <Link href="/" className="font-medium text-brand hover:underline" target="_blank">
            your storefront
          </Link>{" "}
          or a table QR link to see the theme.
        </p>
      </div>
    </Card>
  );
}

/** Valid #rrggbb for native color inputs. */
function normalizePickerColor(value: string | undefined, fallback: string): string {
  return (normalizeHex(value) || normalizeHex(fallback) || fallback).toLowerCase();
}
