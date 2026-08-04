"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";

const FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "name", label: "Name" },
  { key: "tagline", label: "Tagline" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country_code", label: "Country Code" },
  { key: "zip", label: "Zip Code" },
];

export function CompanyForm() {
  const { values, set, save, loading, saving } = useSettingsGroup("company");

  const onSave = async () => {
    const ok = await save();
    toast(ok ? "Company settings saved" : "Save failed", { tone: ok ? "success" : "error" });
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Business Info</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              type={f.type ?? "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Address</Label>
          <textarea
            rows={3}
            value={values.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </div>
      <Button className="mt-5" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save
      </Button>
    </Card>
  );
}
