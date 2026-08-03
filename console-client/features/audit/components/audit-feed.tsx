"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  DatabaseZap,
  Globe,
  Pencil,
  Power,
  ScrollText,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { auditService } from "@/features/audit/services/audit.service";
import type { AuditLog } from "@/features/audit/types/audit";

type Tone = "brand" | "green" | "red" | "amber" | "muted";

const ACTION_META: Record<
  string,
  { icon: typeof Building2; tone: Tone; label: string }
> = {
  "tenant.create": { icon: Building2, tone: "green", label: "Tenant created" },
  "tenant.update": { icon: Pencil, tone: "brand", label: "Tenant updated" },
  "tenant.status": { icon: Power, tone: "amber", label: "Status changed" },
  "tenant.provision": { icon: DatabaseZap, tone: "brand", label: "Provisioned" },
  "tenant.delete": { icon: Trash2, tone: "red", label: "Tenant deleted" },
  "domain.add": { icon: Globe, tone: "brand", label: "Domain added" },
  "domain.verify": { icon: ShieldCheck, tone: "green", label: "Domain verified" },
  "domain.remove": { icon: Trash2, tone: "red", label: "Domain removed" },
};

const TONE_CLASS: Record<Tone, string> = {
  brand: "bg-brand-tint text-brand-deep",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-600",
  amber: "bg-accent-tint text-amber-700",
  muted: "bg-secondary text-muted-foreground",
};

const FILTERS = [
  { value: "", label: "All activity" },
  { value: "tenant.create", label: "Tenant created" },
  { value: "tenant.status", label: "Status changed" },
  { value: "tenant.delete", label: "Tenant deleted" },
  { value: "domain.add", label: "Domain added" },
  { value: "domain.verify", label: "Domain verified" },
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function AuditFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");

  useEffect(() => {
    setLoading(true);
    auditService
      .list({ action: action || undefined, limit: 200 })
      .then(setLogs)
      .catch(() => toast("Couldn't load activity", { tone: "error" }))
      .finally(() => setLoading(false));
  }, [action]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <ScrollText className="size-5 text-brand" /> Activity log
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every consequential platform action — who did what, and when.
          </p>
        </div>
        <div className="w-52">
          <Dropdown value={action} onChange={setAction} options={FILTERS} />
        </div>
      </div>

      <Card className="mt-5 p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            className="py-14"
            icon={ScrollText}
            title="No activity yet"
            description="Platform actions will show up here as they happen."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {logs.map((log) => {
              const meta = ACTION_META[log.action] ?? {
                icon: ScrollText,
                tone: "muted" as Tone,
                label: log.action,
              };
              const Icon = meta.icon;
              const isTenant = log.targetType === "tenant" && log.targetId;
              return (
                <li key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${TONE_CLASS[meta.tone]}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {meta.label}
                      {log.summary && (
                        <span className="font-normal text-muted-foreground">
                          {" — "}
                          {isTenant ? (
                            <Link href={`/tenants/${log.targetId}`} className="text-brand hover:underline">
                              {log.summary.split("—").pop()?.trim() ?? log.summary}
                            </Link>
                          ) : (
                            (log.summary.split("—").pop()?.trim() ?? log.summary)
                          )}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.actorEmail ?? "system"}
                      {log.ip ? ` · ${log.ip}` : ""}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={log.createdAt}
                    title={new Date(log.createdAt).toLocaleString()}
                  >
                    {relativeTime(log.createdAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
