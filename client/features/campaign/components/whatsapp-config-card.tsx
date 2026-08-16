"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { campaignService } from "@/features/campaign/services/campaign.service";
import type { WhatsappConfig } from "@/features/campaign/types/campaign.types";

/** Per-tenant WhatsApp Cloud API credentials. Sends run in simulate mode until
 *  these are filled in and enabled. */
export function WhatsappConfigCard() {
  const [config, setConfig] = useState<WhatsappConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    campaignService
      .getConfig()
      .then(setConfig)
      .catch(() =>
        setConfig({
          enabled: false,
          phoneNumberId: "",
          accessToken: "",
          businessAccountId: "",
          storefrontUrl: "",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const patch = (p: Partial<WhatsappConfig>) => setConfig((c) => (c ? { ...c, ...p } : c));

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const saved = await campaignService.saveConfig(config);
      setConfig(saved);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const connected = Boolean(config?.enabled && config?.phoneNumberId && config?.accessToken);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-brand" />
          <CardTitle className="font-display text-base">WhatsApp connection</CardTitle>
        </div>
        <StatusPill tone={connected ? "green" : "neutral"}>
          {connected ? "Connected" : "Simulate mode"}
        </StatusPill>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || !config ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Use your own WhatsApp Cloud API credentials from Meta. Until connected, campaigns run
              in <span className="font-medium text-ink">simulate mode</span> (recipients are logged,
              no real messages sent) — so you can test the flow for free.
            </p>

            <label className="flex items-center justify-between gap-2 rounded-xl border border-border bg-subtle/50 px-4 py-3">
              <div>
                <p className="font-medium text-ink">Enable WhatsApp sending</p>
                <p className="text-sm text-muted-foreground">Send real messages via Meta.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.enabled}
                onClick={() => patch({ enabled: !config.enabled })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${config.enabled ? "bg-brand" : "bg-border"}`}
              >
                <span
                  className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${config.enabled ? "left-5" : "left-0.5"}`}
                />
              </button>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number ID">
                <Input
                  value={config.phoneNumberId}
                  onChange={(e) => patch({ phoneNumberId: e.target.value })}
                  placeholder="From Meta → WhatsApp → API setup"
                />
              </Field>
              <Field label="Business account ID">
                <Input
                  value={config.businessAccountId}
                  onChange={(e) => patch({ businessAccountId: e.target.value })}
                  placeholder="WABA ID"
                />
              </Field>
              <Field label="Access token" className="sm:col-span-2">
                <Input
                  type="password"
                  value={config.accessToken}
                  onChange={(e) => patch({ accessToken: e.target.value })}
                  placeholder="Permanent access token"
                />
              </Field>
              <Field label="Storefront URL (for promo links)" className="sm:col-span-2">
                <Input
                  value={config.storefrontUrl}
                  onChange={(e) => patch({ storefrontUrl: e.target.value })}
                  placeholder="https://your-shop.com"
                />
              </Field>
            </div>

            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save settings
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
