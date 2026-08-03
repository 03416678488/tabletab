"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { toast } from "@/hooks/use-toast";
import { domainService } from "@/features/domains/services/domain.service";
import type {
  DomainKind,
  DomainStatus,
  TenantDomain,
} from "@/features/domains/types/domain";

const STATUS: Record<DomainStatus, { tone: "amber" | "green" | "red"; label: string }> = {
  pending: { tone: "amber", label: "Pending DNS" },
  verified: { tone: "green", label: "Verified" },
  failed: { tone: "red", label: "Failed" },
};

/** A copyable inline value, used for the DNS record name/value. */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard may be unavailable — ignore */
    }
  };
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <code className="min-w-0 flex-1 truncate rounded-md bg-white px-2 py-1 font-mono text-xs text-ink ring-1 ring-border">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-ink"
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function DomainsManager({ tenantId }: { tenantId: string }) {
  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [hostname, setHostname] = useState("");
  const [kind, setKind] = useState<DomainKind>("storefront");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    domainService
      .list(tenantId)
      .then(setDomains)
      .catch(() => toast("Couldn't load domains", { tone: "error" }))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const add = async () => {
    const host = hostname.trim().toLowerCase();
    if (!host) return;
    setAdding(true);
    try {
      const created = await domainService.add(tenantId, { hostname: host, kind });
      setDomains((d) => [...d, created]);
      setHostname("");
      toast("Domain added — publish the TXT record, then verify", { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't add domain", { tone: "error" });
    } finally {
      setAdding(false);
    }
  };

  const verify = async (d: TenantDomain) => {
    setBusyId(d.id);
    try {
      const updated = await domainService.verify(d.id);
      setDomains((list) => list.map((x) => (x.id === d.id ? updated : x)));
      toast(
        updated.status === "verified"
          ? `${d.hostname} verified`
          : updated.lastError ?? "Still not verified",
        { tone: updated.status === "verified" ? "success" : "error" },
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Verification failed", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (d: TenantDomain) => {
    if (!confirm(`Remove ${d.hostname}? If it's live, routing to it will stop.`)) return;
    setBusyId(d.id);
    try {
      await domainService.remove(d.id);
      setDomains((list) => list.filter((x) => x.id !== d.id));
      toast(`${d.hostname} removed`, { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't remove domain", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <Globe className="size-4 text-brand" /> Custom domains
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Map the customer&apos;s own hostnames. Each must pass a DNS TXT check before it routes to
          the tenant.
        </p>
      </div>

      {/* Add form */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="acme.com"
          className="h-9 flex-1 font-mono"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <div className="w-40">
          <Dropdown
            value={kind}
            onChange={(v) => setKind(v as DomainKind)}
            options={[
              { value: "storefront", label: "Storefront" },
              { value: "admin", label: "Admin" },
            ]}
          />
        </div>
        <Button size="sm" onClick={add} disabled={adding || !hostname.trim()}>
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </Button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : domains.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            No custom domains yet. The tenant is reachable at its subdomain.
          </p>
        ) : (
          domains.map((d) => {
            const s = STATUS[d.status];
            return (
              <div key={d.id} className="rounded-xl border border-border bg-subtle/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-ink">{d.hostname}</span>
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                      {d.kind}
                    </span>
                    <StatusPill tone={s.tone}>{s.label}</StatusPill>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verify(d)}
                      disabled={busyId === d.id || d.status === "verified"}
                    >
                      {busyId === d.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : d.status === "verified" ? (
                        <ShieldCheck className="size-4 text-emerald-600" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      {d.status === "verified" ? "Verified" : "Verify"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => remove(d)}
                      disabled={busyId === d.id}
                      aria-label="Remove domain"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {d.status !== "verified" && (
                  <div className="mt-3 rounded-lg border border-border bg-white/60 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Add this DNS record at the domain&apos;s provider, then click Verify:
                    </p>
                    <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
                      <div className="flex items-center">
                        <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-medium text-ink">
                          {d.dns.recordType}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <CopyField label="Name / Host" value={d.dns.name} />
                        <CopyField label="Value" value={d.dns.value} />
                      </div>
                    </div>
                    {d.status === "failed" && d.lastError && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                        <TriangleAlert className="size-3.5" /> {d.lastError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
