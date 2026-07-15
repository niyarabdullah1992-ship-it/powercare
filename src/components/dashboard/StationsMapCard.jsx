import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

// Compact map card with gold markers on every located station (mockup's world-map panel).
export default function StationsMapCard({ stations, t }) {
  const located = stations.filter((s) => s.lat != null && s.lng != null);
  const center = located.length ? [located[0].lat, located[0].lng] : [24.7136, 46.6753];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h3 className="font-heading text-base font-semibold">{t("workplaceLocations")}</h3>
      </div>
      {located.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm font-body text-muted-foreground">{t("locationNotSet")}</p>
      ) : (
        <MapContainer center={center} zoom={located.length > 1 ? 5 : 11} style={{ height: 210, width: "100%" }} scrollWheelZoom={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {located.map((s) => (
            <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={8} pathOptions={{ color: "#a9782f", fillColor: "#c99b4f", fillOpacity: 0.9, weight: 2 }}>
              <LeafletTooltip>{s.name}</LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}