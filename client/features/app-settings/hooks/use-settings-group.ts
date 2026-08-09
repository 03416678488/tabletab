"use client";

import { useCallback, useEffect, useState } from "react";

import { httpClient, ApiError } from "@/lib/httpClient";
import { settingsService } from "@/features/app-settings/services/settings.service";
import { useSettings } from "@/features/app-settings/components/settings-provider";

/** Load + edit + save one settings group (e.g. "company", "site"). */
export function useSettingsGroup(group: string) {
  const { refresh } = useSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    httpClient
      .get<Record<string, string>>(`/settings/${group}`, { auth: true })
      .then((r) => {
        if (alive) setValues(r.data ?? {});
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : "Failed to load");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [group]);

  const set = useCallback(
    (key: string, value: string) => setValues((v) => ({ ...v, [key]: value })),
    [],
  );

  /** Drop a key so it's excluded from the next save (saveGroup is upsert-only,
   *  so an omitted key is simply not re-written). */
  const unset = useCallback(
    (key: string) =>
      setValues((v) => {
        if (!(key in v)) return v;
        const { [key]: _omit, ...rest } = v;
        return rest;
      }),
    [],
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await settingsService.saveGroup(group, values);
      await refresh(); // re-apply currency/display settings app-wide
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [group, values, refresh]);

  return { values, set, unset, save, loading, saving, error };
}
