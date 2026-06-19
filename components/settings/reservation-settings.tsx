"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BranchReservationSettings } from "@/lib/types";

export function ReservationSettings() {
  const branches = useSettingsStore((s) => s.branches);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [settings, setSettings] = useState<BranchReservationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!branchId && branches[0]) setBranchId(branches[0].id);
  }, [branchId, branches]);

  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    setLoading(true);
    api.getReservationSettings(branchId).then((s) => {
      if (!cancelled) {
        setSettings(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const patch = (partial: Partial<Omit<BranchReservationSettings, "branchId">>) => {
    if (!settings) return;
    setSettings({ ...settings, ...partial });
  };

  const handleSave = async () => {
    if (!settings || !branchId) return;
    setSaving(true);
    try {
      const { branchId: _, ...rest } = settings;
      await api.updateReservationSettings(branchId, rest);
      toast("Reservation settings saved", { tone: "success" });
    } catch {
      toast("Could not save settings", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Building2 className="size-5 text-brand" />
        <div>
          <CardTitle className="font-display text-base">Table reservations</CardTitle>
          <p className="text-sm text-muted-foreground">Per-branch booking rules and reminders</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="res-branch">Branch</Label>
          <select
            id="res-branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {loading || !settings ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl border border-border bg-subtle/50 px-4 py-3">
              <div>
                <p className="font-medium text-ink">Accept online reservations</p>
                <p className="text-sm text-muted-foreground">
                  Show &ldquo;Reserve a table&rdquo; on the public site
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.enabled}
                onClick={() => patch({ enabled: !settings.enabled })}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  settings.enabled ? "bg-brand" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                    settings.enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill tone={settings.enabled ? "green" : "neutral"}>
                {settings.enabled ? "Enabled" : "Disabled"}
              </StatusPill>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="turn-time">Turn time (minutes)</Label>
                <Input
                  id="turn-time"
                  type="number"
                  min={30}
                  max={180}
                  value={settings.turnTimeMins}
                  onChange={(e) => patch({ turnTimeMins: parseInt(e.target.value, 10) || 90 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-lead">Reminder lead (minutes)</Label>
                <Input
                  id="reminder-lead"
                  type="number"
                  min={5}
                  max={120}
                  value={settings.reminderLeadMins}
                  onChange={(e) =>
                    patch({ reminderLeadMins: parseInt(e.target.value, 10) || 30 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no-show-grace">No-show grace (minutes)</Label>
                <Input
                  id="no-show-grace"
                  type="number"
                  min={5}
                  max={60}
                  value={settings.noShowGraceMins}
                  onChange={(e) =>
                    patch({ noShowGraceMins: parseInt(e.target.value, 10) || 15 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-window">Booking window (days)</Label>
                <Input
                  id="booking-window"
                  type="number"
                  min={1}
                  max={90}
                  value={settings.bookingWindowDays}
                  onChange={(e) =>
                    patch({ bookingWindowDays: parseInt(e.target.value, 10) || 14 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cutoff">Minimum lead time (minutes)</Label>
                <Input
                  id="cutoff"
                  type="number"
                  min={0}
                  max={240}
                  value={settings.cutoffMins}
                  onChange={(e) => patch({ cutoffMins: parseInt(e.target.value, 10) || 60 })}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save reservation settings"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
