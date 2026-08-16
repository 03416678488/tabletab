"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/datetime";
import { toast } from "@/hooks/use-toast";

import { currencyService } from "@/features/currency/services/currency.service";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import type { FxSettings } from "@/features/currency/types/currency.types";

export function ExchangeRateSettings({ onChange }: { onChange?: () => void }) {
  const { get, refresh } = useSettings();
  const [data, setData] = useState<FxSettings | null>(null);
  const [provider, setProvider] = useState("");
  const [frequency, setFrequency] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    setLoading(true);
    currencyService
      .fxSettings()
      .then((d) => {
        setData(d);
        setProvider(d.provider);
        setFrequency(d.frequency);
        setKey(d.keys.exchangerate_api ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const selectedProvider = useMemo(
    () => data?.providers.find((p) => p.id === provider),
    [data, provider],
  );

  const base = get("site", "default_currency") || "USD";

  const save = async () => {
    setSaving(true);
    try {
      await currencyService.saveFxSettings({
        provider,
        frequency,
        keys: { exchangerate_api: key },
      });
      await refresh();
      load(); // refetch the full fx-settings (incl. provider catalog)
      onChange?.();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const res = await currencyService.sync();
      const via = res.provider ? ` via ${res.provider}` : "";
      const skipped = res.skipped.length ? ` · skipped ${res.skipped.join(", ")}` : "";
      toast(`Updated ${res.updated} rate${res.updated === 1 ? "" : "s"}${via}${skipped}`, {
        tone: res.updated > 0 ? "success" : "error",
      });
      await refresh();
      load();
      onChange?.();
    } catch {
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !data) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Exchange Rates</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Base currency <span className="font-medium text-ink">{base}</span> ·{" "}
            {data.syncedAt
              ? `last synced ${formatDateTime(data.syncedAt)}${data.lastProvider ? ` via ${data.lastProvider}` : ""}`
              : "never synced"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={syncNow} disabled={syncing}>
          {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Sync now
        </Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Provider</Label>
          <Dropdown
            value={provider}
            onChange={(v) => setProvider(v)}
            aria-label="Provider"
            options={data.providers.map((p) => ({
              value: p.id,
              label: p.label,
              sublabel: p.requiresKey ? "key required" : "free",
            }))}
          />
          {selectedProvider && (
            <p className="text-xs text-muted-foreground">{selectedProvider.note}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Auto-sync frequency</Label>
          <Dropdown
            value={frequency}
            onChange={(v) => setFrequency(v)}
            aria-label="Auto-sync frequency"
            options={data.frequencies.map((f) => ({ value: f.value, label: f.label }))}
          />
        </div>

        <div
          className={cn("space-y-1.5 sm:col-span-2", !selectedProvider?.requiresKey && "hidden")}
        >
          <Label>API Key ({selectedProvider?.label})</Label>
          <Input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste your API key"
          />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground">
        If the chosen provider can’t serve your base currency, we automatically fall back through
        the free providers — so rates keep updating even for currencies ECB doesn’t publish (e.g.
        BDT, NGN).
      </div>

      <Button className="mt-5" onClick={save} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save
      </Button>
    </Card>
  );
}
