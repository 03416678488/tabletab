"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ImagePickerField } from "@/features/media/components/image-picker-field";

import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";

export type SettingsField =
  | { key: string; label: string; type?: "text" | "email" | "url" | "number" | "password"; full?: boolean }
  | { key: string; label: string; type: "textarea"; full?: boolean }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; full?: boolean }
  | { key: string; label: string; type: "toggle"; full?: boolean }
  | { key: string; label: string; type: "image"; full?: boolean };

interface SettingsFormProps {
  group: string;
  title: string;
  fields: SettingsField[];
  /** Optional non-field content rendered below the fields (e.g. presets). */
  children?: React.ReactNode;
}

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

export function SettingsForm({ group, title, fields, children }: SettingsFormProps) {
  const { values, set, save, loading, saving } = useSettingsGroup(group);

  const onSave = async () => {
    const ok = await save();
    toast(ok ? `${title} saved` : "Save failed", { tone: ok ? "success" : "error" });
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.key}
            className={cn("space-y-1.5", (f.full || f.type === "textarea") && "sm:col-span-2")}
          >
            <Label>{f.label}</Label>

            {f.type === "textarea" ? (
              <textarea
                rows={3}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            ) : f.type === "select" ? (
              <select
                className={SELECT_CLASS}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              >
                <option value="">—</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "toggle" ? (
              <div className="flex items-center gap-5 pt-1.5">
                {["enable", "disable"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm capitalize text-ink">
                    <input
                      type="radio"
                      name={`${group}-${f.key}`}
                      className="size-4 accent-brand"
                      checked={(values[f.key] ?? "") === opt}
                      onChange={() => set(f.key, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : f.type === "image" ? (
              <ImagePickerField
                value={values[f.key] ?? ""}
                onChange={(url) => set(f.key, url)}
              />
            ) : (
              <Input
                type={f.type ?? "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {children}

      <Button className="mt-5" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save
      </Button>
    </Card>
  );
}
