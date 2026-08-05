"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Brand-coloured pin as an inline SVG divIcon (avoids Leaflet's default marker
// image assets, which break under bundlers). `var(--brand)` inherits from :root.
const pinIcon = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
      fill="var(--brand)" stroke="white" stroke-width="1.5" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
      <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/>
      <circle cx="12" cy="11" r="2.4" fill="white" stroke="none"/>
    </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 29],
});

/** Read-only map that pins a saved address's exact location. */
export default function AddressMap({
  lat,
  lng,
  className,
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // `isolate` traps Leaflet's high internal z-indexes in their own stacking
        // context so the map can't paint over modals/dialogs.
        "isolate h-40 w-full overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <MapContainer
        // Remount when the selected address changes so it recentres.
        key={`${lat},${lng}`}
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  );
}
