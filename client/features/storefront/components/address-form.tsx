"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Briefcase, Check, Crosshair, Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { flash } from "@/features/storefront/hooks/use-storefront-flash";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Address, AddressType } from "@/lib/types";
import { cn } from "@/lib/utils";

// Leaflet needs `window`, so load the picker client-side only.
const MapPicker = dynamic(() => import("@/features/branch/components/branch-map-picker"), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-secondary" />,
});

const ADDRESS_TYPES: { value: AddressType; label: string; icon: typeof Home }[] = [
  { value: "home", label: "Home", icon: Home },
  { value: "work", label: "Work", icon: Briefcase },
  { value: "other", label: "Others", icon: MapPin },
];

interface AddressFormProps {
  onSave: (address: Omit<Address, "id">) => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  /** When set, the form starts pre-filled for editing this address. */
  initial?: Address;
}

/** Delivery-address form: address-type picker, map pin, and address fields. */
export function AddressForm({ onSave, onCancel, saving, initial }: AddressFormProps) {
  const [type, setType] = useState<AddressType>(initial?.type ?? "home");
  const [customLabel, setCustomLabel] = useState(initial?.type === "other" ? initial.label : "");
  const [line1, setLine1] = useState(initial?.line1 ?? "");
  const [line2, setLine2] = useState(initial?.line2 ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? "");
  const [lat, setLat] = useState<number | undefined>(initial?.lat);
  const [lng, setLng] = useState<number | undefined>(initial?.lng);
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  const setPoint = (la: number, ln: number) => {
    setLat(la);
    setLng(ln);
  };

  const handleUseLocation = async () => {
    try {
      const { lat: la, lng: ln } = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setPoint(la, ln);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Couldn't get your location", { tone: "error" });
    }
  };

  const handleSave = () => {
    if (!line1.trim() || !city.trim()) {
      flash("Add the street address and city", { tone: "error" });
      return;
    }
    const label =
      type === "other"
        ? customLabel.trim() || "Others"
        : (ADDRESS_TYPES.find((t) => t.value === type)?.label ?? "Home");
    void onSave({
      label,
      type,
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      postalCode: postalCode.trim(),
      lat,
      lng,
      isDefault,
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      {/* Address type */}
      <div className="space-y-2">
        <Label>
          Address Type <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {ADDRESS_TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-brand bg-brand-tint text-brand"
                    : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-ink",
                )}
              >
                <Icon className="size-5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {type === "other" && (
        <div className="space-y-1">
          <Label htmlFor="addr-custom-label">Label</Label>
          <Input
            id="addr-custom-label"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g. Gym, Parents' place"
          />
        </div>
      )}

      {/* Map pin */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Pin your exact location</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleUseLocation()}
          >
            <Crosshair className="size-4" />
            Use my location
          </Button>
        </div>
        <MapPicker lat={lat} lng={lng} onChange={setPoint} />
        <p className="text-xs text-muted-foreground">
          Drag the map so the crosshair sits on your building.
        </p>
      </div>

      {/* Address fields */}
      <div className="space-y-1">
        <Label htmlFor="addr-line1">Street address</Label>
        <Input
          id="addr-line1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          placeholder="House / flat no., street"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="addr-line2">Apartment, floor (optional)</Label>
        <Input
          id="addr-line2"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Landmark, floor, unit"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="addr-city">City</Label>
          <Input
            id="addr-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr-postal">Postal code</Label>
          <Input
            id="addr-postal"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Postal code"
          />
        </div>
      </div>

      {/* Set as default */}
      <button
        type="button"
        onClick={() => setIsDefault((v) => !v)}
        aria-pressed={isDefault}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            isDefault ? "border-brand bg-brand text-primary-foreground" : "border-border",
          )}
        >
          {isDefault && <Check className="size-3.5" />}
        </span>
        <span className="text-sm font-medium text-ink">Set as default address</span>
      </button>

      <div className="flex gap-2 pt-1">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save address"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
