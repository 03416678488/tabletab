"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bug, X } from "lucide-react";

import { useSettings } from "@/features/app-settings/components/settings-provider";

/**
 * On-screen App Debug badge (Settings → System → App Debug). A small fixed pill
 * that expands to show the current environment, build, tenant/branch and signed-
 * in user — handy while troubleshooting. Rendered only when App Debug is on.
 */
export function DebugBadge() {
  const { get } = useSettings();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (get("site", "app_debug") !== "enable") return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  let host = appUrl;
  try {
    if (appUrl) host = new URL(appUrl).host;
  } catch {
    /* keep raw */
  }

  const user = session?.user;
  const rows: { label: string; value: string }[] = [
    { label: "Env", value: process.env.NODE_ENV ?? "—" },
    { label: "Host", value: host || "—" },
    { label: "Tenant", value: get("company", "name") || "—" },
    { label: "User", value: user?.email ?? "— (signed out)" },
    { label: "Roles", value: user?.roles ? Object.keys(user.roles).join(", ") || "—" : "—" },
    { label: "Branch", value: user?.branchId ?? "all branches" },
    { label: "Timezone", value: get("site", "default_timezone") || "UTC" },
  ];

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-[110] print:hidden">
      {open ? (
        <div className="w-72 rounded-xl border border-amber-500/40 bg-ink/95 p-3 text-white shadow-[var(--shadow-elevated)] backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-300">
              <Bug className="size-3.5" /> App Debug
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Collapse debug info"
              className="rounded p-0.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <dl className="space-y-1 font-mono text-[11px] leading-snug">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-2">
                <dt className="w-16 shrink-0 text-white/50">{r.label}</dt>
                <dd className="min-w-0 flex-1 break-words text-amber-100">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-ink/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-300 shadow-lg backdrop-blur hover:bg-ink"
        >
          <Bug className="size-3.5" /> Debug
        </button>
      )}
    </div>
  );
}
