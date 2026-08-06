"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getPrefs,
  setPrefs,
  type NotificationPrefs,
} from "@/features/notifications/lib/notifications-client";

/** Categories a user can individually mute (chime/toast only). */
const CATEGORIES: { key: string; label: string }[] = [
  { key: "orders", label: "Orders" },
  { key: "reservations", label: "Reservations" },
  { key: "payments", label: "Payments" },
  { key: "register", label: "Register" },
];

export function NotificationPreferences() {
  const [prefs, setLocal] = useState<NotificationPrefs>(() => getPrefs());

  // Read persisted prefs on mount (avoids a hydration mismatch).
  useEffect(() => setLocal(getPrefs()), []);

  const update = (patch: Partial<NotificationPrefs>) => {
    setLocal((p) => ({ ...p, ...patch }));
    setPrefs(patch);
  };

  const toggleCategory = (key: string, muted: boolean) => {
    const set = new Set(prefs.mutedCategories);
    if (muted) set.add(key);
    else set.delete(key);
    update({ mutedCategories: [...set] });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-medium text-ink">
              <Moon className="size-4 text-brand" /> Do Not Disturb
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Silences the sound and pop-ups for everything except critical alerts.
            </p>
          </div>
          <Toggle checked={prefs.dnd} onChange={(v) => update({ dnd: v })} />
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="font-medium text-ink">Quiet hours</p>
        <p className="text-sm text-muted-foreground">
          Mute the sound and pop-ups during these hours (the badge still updates).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            From
            <Input
              type="time"
              className="h-9 w-32"
              value={prefs.quietFrom ?? ""}
              onChange={(e) => update({ quietFrom: e.target.value || null })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            To
            <Input
              type="time"
              className="h-9 w-32"
              value={prefs.quietTo ?? ""}
              onChange={(e) => update({ quietTo: e.target.value || null })}
            />
          </label>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="font-medium text-ink">Mute by category</p>
        <p className="text-sm text-muted-foreground">
          Muted categories still show in the list — they just don&apos;t sound or pop up.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((c) => {
            const muted = prefs.mutedCategories.includes(c.key);
            return (
              <label
                key={c.key}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="text-ink">{c.label}</span>
                <Toggle checked={!muted} onChange={(v) => toggleCategory(c.key, !v)} />
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-brand" : "bg-secondary"
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
