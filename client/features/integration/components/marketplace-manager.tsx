"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bike,
  Calculator,
  CheckCircle2,
  Loader2,
  Megaphone,
  MessageCircle,
  Plug,
  ScrollText,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { formatDateTime } from "@/lib/datetime";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSession } from "@/hooks/use-session";

import { integrationService } from "@/features/integration/services/integration.service";
import type {
  CatalogItem,
  IntegrationCategory,
  SyncLog,
} from "@/features/integration/types/integration.types";

const DIRECTION_LABEL: Record<SyncLog["direction"], string> = {
  order_in: "Order in",
  menu_out: "Menu out",
  status_out: "Status out",
};

const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const CATEGORY_ICON: Record<IntegrationCategory, LucideIcon> = {
  delivery: Bike,
  messaging: MessageCircle,
  accounting: Calculator,
  marketing: Megaphone,
};

const TABS = [
  { key: "all", label: "All" },
  { key: "delivery", label: "Delivery" },
  { key: "messaging", label: "Messaging" },
  { key: "accounting", label: "Accounting" },
  { key: "marketing", label: "Marketing" },
];

export function MarketplaceManager() {
  const role = useSession((s) => s.user?.role);
  const confirm = useConfirm();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [connecting, setConnecting] = useState<CatalogItem | null>(null);
  const [pushingKey, setPushingKey] = useState<string | null>(null);
  const [logsFor, setLogsFor] = useState<CatalogItem | null>(null);

  const load = async () => {
    try {
      setItems(await integrationService.list());
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  // Toast the result of an OAuth callback redirect (?connected= / ?error=).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) toast(`${connected} connected`, { tone: "success" });
    else if (error) toast(error, { tone: "error" });
    if (connected || error) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const shown = useMemo(
    () => (tab === "all" ? items : items.filter((i) => i.category === tab)),
    [items, tab],
  );
  const connectedCount = items.filter((i) => i.connected).length;

  const disconnect = async (item: CatalogItem) => {
    if (!(await confirm({ title: `Disconnect ${item.name}?`, confirmLabel: "Disconnect" }))) return;
    try {
      await integrationService.disconnect(item.key);
      toast(`${item.name} disconnected`, { tone: "success" });
      void load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to disconnect", { tone: "error" });
    }
  };

  const startOAuth = async (item: CatalogItem) => {
    try {
      const { url } = await integrationService.startOAuth(item.key);
      window.location.href = url; // hand off to the provider's consent screen
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't start OAuth", { tone: "error" });
    }
  };

  const pushMenu = async (item: CatalogItem) => {
    setPushingKey(item.key);
    try {
      const res = await integrationService.pushMenu(item.key);
      toast(
        `Menu ${res.status === "sent" ? "pushed" : "prepared"} — ${res.items} items, ${res.categories} categories`,
        { tone: "success" },
      );
      void load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Menu push failed", { tone: "error" });
    } finally {
      setPushingKey(null);
    }
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
          <Plug className="size-5 text-brand" /> Marketplace
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Connect third-party tools — delivery apps, messaging, accounting and more.
          {connectedCount > 0 && ` · ${connectedCount} connected`}
        </p>
      </div>

      <SegmentedTabs
        className="mt-4"
        aria-label="Integration category"
        value={tab}
        onChange={setTab}
        tabs={TABS}
      />

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          className="mt-5 py-12"
          icon={Plug}
          title="Nothing here"
          description="No integrations in this category yet."
        />
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => {
            return (
              <Card key={item.key} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <ProviderIcon item={item} />
                  {item.connected ? (
                    <StatusPill tone="green">
                      <CheckCircle2 className="size-3" /> Connected
                    </StatusPill>
                  ) : item.status === "coming_soon" ? (
                    <StatusPill tone="neutral">Coming soon</StatusPill>
                  ) : (
                    <StatusPill tone="blue">Available</StatusPill>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  {item.connected && item.webhookPath && item.webhookToken && (
                    <div className="mt-2 rounded-lg border border-border bg-secondary/40 p-2.5 text-[11px]">
                      <p className="font-medium text-ink">Webhook URL (orders in)</p>
                      <p className="mt-0.5 break-all text-muted-foreground">
                        <code className="text-ink">
                          {apiBase()}
                          {item.webhookPath}/{item.webhookToken}
                        </code>
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Give this to {item.name} — it routes orders to your restaurant.
                      </p>
                    </div>
                  )}
                  {item.connected && item.lastSyncAt && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Menu synced {formatDateTime(item.lastSyncAt)}
                    </p>
                  )}
                </div>

                <div>{action(item)}</div>
              </Card>
            );
          })}
        </div>
      )}

      <ConnectDialog
        item={connecting}
        onClose={() => setConnecting(null)}
        onConnected={() => {
          setConnecting(null);
          void load();
        }}
      />

      <LogsDialog item={logsFor} onClose={() => setLogsFor(null)} />
    </div>
  );

  function action(item: CatalogItem) {
    if (item.connected) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {item.canPushMenu && (
            <Button
              size="sm"
              onClick={() => void pushMenu(item)}
              disabled={pushingKey === item.key}
            >
              {pushingKey === item.key ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              Push menu
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setLogsFor(item)}>
            <ScrollText className="size-4" /> Logs
          </Button>
          <Button variant="outline" size="sm" onClick={() => void disconnect(item)}>
            Disconnect
          </Button>
        </div>
      );
    }
    if (item.status === "coming_soon") {
      return (
        <Button variant="outline" size="sm" disabled>
          Coming soon
        </Button>
      );
    }
    if (item.authType === "builtin" && item.manageSlug && role) {
      return (
        <Button asChild size="sm">
          <Link href={`/${role}/${item.manageSlug}`}>Manage</Link>
        </Button>
      );
    }
    if (item.authType === "oauth") {
      return (
        <Button size="sm" onClick={() => void startOAuth(item)}>
          Connect
        </Button>
      );
    }
    return (
      <Button size="sm" onClick={() => setConnecting(item)}>
        Connect
      </Button>
    );
  }
}

function ConnectDialog({
  item,
  onClose,
  onConnected,
}: {
  item: CatalogItem | null;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues({}), [item]);

  const submit = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await integrationService.connect(item.key, values);
      toast(`${item.name} connected`, { tone: "success" });
      onConnected();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to connect", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect {item?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {(item?.fields ?? []).map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          {(item?.fields ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              This will enable {item?.name} for your account.
            </p>
          )}
          {item?.webhookPath && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              A unique, per-restaurant <span className="font-medium text-ink">webhook URL</span> is
              generated when you connect — it appears on the card, ready to paste into {item.name}.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProviderIcon({ item }: { item: CatalogItem }) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICON[item.category] ?? Plug;
  if (failed) {
    return (
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
        <Icon className="size-5" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/integration-icons/${item.key}.svg`}
      alt={`${item.name} logo`}
      className="size-11 rounded-xl"
      onError={() => setFailed(true)}
    />
  );
}

function timeLabel(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function LogsDialog({ item, onClose }: { item: CatalogItem | null; onClose: () => void }) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    integrationService
      .logs(item.key)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [item]);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item?.name} — recent activity</DialogTitle>
        </DialogHeader>
        <div className="max-h-[24rem] overflow-y-auto">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-2.5">
                  <StatusPill tone={log.status === "success" ? "green" : "red"}>
                    {DIRECTION_LABEL[log.direction]}
                  </StatusPill>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{log.message ?? "—"}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeLabel(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
