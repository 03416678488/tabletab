"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface BranchMapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

/** Default view when no point is set yet. */
const DEFAULT_CENTER: [number, number] = [45.5231, -122.6765];

/**
 * The map centre *is* the selected point: the user pans the map under a fixed
 * crosshair, and we read the centre on move-end. External updates (typed
 * coords / "use my location") recentre the map without echoing back.
 */
function CenterTracker({
  lat,
  lng,
  onChange,
}: {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const programmatic = useRef(false);

  useEffect(() => {
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const c = map.getCenter();
    if (Math.abs(c.lat - lat) > 1e-5 || Math.abs(c.lng - lng) > 1e-5) {
      programmatic.current = true;
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }
  }, [lat, lng, map]);

  useMapEvents({
    moveend() {
      if (programmatic.current) {
        programmatic.current = false;
        return;
      }
      const c = map.getCenter();
      onChange(c.lat, c.lng);
    },
  });

  return null;
}

export default function BranchMapPicker({ lat, lng, onChange }: BranchMapPickerProps) {
  const hasPoint = typeof lat === "number" && typeof lng === "number";
  const center: [number, number] = hasPoint ? [lat!, lng!] : DEFAULT_CENTER;

  return (
    <div className="relative isolate h-56 w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={hasPoint ? 14 : 11}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CenterTracker lat={lat} lng={lng} onChange={onChange} />
      </MapContainer>

      {/* Fixed center crosshair — the point is wherever the map is centred. */}
      <div className="pointer-events-none absolute inset-0 z-[500]">
        <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-brand/80 shadow-[0_0_0_1px_rgba(255,255,255,0.6)]" />
        <span className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-brand/80 shadow-[0_0_0_1px_rgba(255,255,255,0.6)]" />
        <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-brand bg-white/80 shadow" />
      </div>
    </div>
  );
}
