"use client";

import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Country, State, City } from "country-state-city";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
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
];

// Countries are static — compute once. State/city cascade off the selection.
const COUNTRIES = Country.getAllCountries();
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.name, label: c.name }));

export function CompanyForm() {
  const { values, set, unset, save, loading, saving } = useSettingsGroup("company");

  // Retired fields — drop any stale values so a save never re-writes them.
  useEffect(() => {
    if ("zip" in values) unset("zip");
    if ("country_code" in values) unset("country_code");
  }, [values, unset]);

  const countryName = values.country ?? "";
  const stateName = values.state ?? "";
  const cityName = values.city ?? "";

  // Resolve the stored names back to ISO codes to drive the cascade.
  const countryIso = useMemo(
    () => COUNTRIES.find((c) => c.name === countryName)?.isoCode,
    [countryName],
  );
  const states = useMemo(
    () => (countryIso ? State.getStatesOfCountry(countryIso) : []),
    [countryIso],
  );
  const stateIso = useMemo(
    () => states.find((s) => s.name === stateName)?.isoCode,
    [states, stateName],
  );
  const cities = useMemo(
    () => (countryIso && stateIso ? City.getCitiesOfState(countryIso, stateIso) : []),
    [countryIso, stateIso],
  );

  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.name, label: s.name })),
    [states],
  );
  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.name, label: c.name })),
    [cities],
  );

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

        {/* Country → State → City (each list depends on the one above it) */}
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Dropdown
            aria-label="Country"
            searchable
            placeholder="Select country"
            value={countryName}
            options={COUNTRY_OPTIONS}
            onChange={(v) => {
              set("country", v);
              set("state", "");
              set("city", "");
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <Dropdown
            aria-label="State"
            searchable
            disabled={!countryIso}
            placeholder={countryIso ? "Select state" : "Select a country first"}
            value={stateName}
            options={stateOptions}
            onChange={(v) => {
              set("state", v);
              set("city", "");
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Dropdown
            aria-label="City"
            searchable
            disabled={!stateIso}
            placeholder={stateIso ? "Select city" : "Select a state first"}
            value={cityName}
            options={cityOptions}
            onChange={(v) => set("city", v)}
          />
        </div>

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
