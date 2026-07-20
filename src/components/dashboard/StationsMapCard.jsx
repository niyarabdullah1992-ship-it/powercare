import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2 } from "lucide-react";
import { resolveStationPositions } from "@/lib/geocodeStations";

// Compact map card with gold markers on every located station. Stations without
// a pinned GPS point are placed automatically from the coordinates or city name
// written in their "location" field.
export default function StationsMapCard({ stations, t }) {
  const [located, setLocated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resolveStationPositions(stations).then((rows) => { if (!cancelled) setLocated(rows); });
    return () => { cancelled = true; };
  }, [stations.map((s) => `${s.id}:${s.lat},${s.lng},${s.location || ""}`).join("|")]);

  const rows = located || [];
  const center = rows.length ? [rows[0].lat, rows[0].lng] : [24.7136, 46.6753];

  return (
    <div className="overflow-hidden rounded-2xl border border-ops-border bg-ops-surface shadow-sm">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h3 className="font-heading text-base font-semibold">{t("workplaceLocations")}</h3>
      </div>
      {located === null ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm font-body text-muted-foreground">{t("locationNotSet")}</p>
      ) : (
        <MapContainer
          key={rows.map((s) => s.id).join(",")}
          center={center}
          zoom={rows.length > 1 ? 5 : 11}
          style={{ height: 210, width: "100%" }}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {rows.map((s) => (
            <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={8} pathOptions={{ color: "#a9782f", fillColor: "#c99b4f", fillOpacity: 0.9, weight: 2 }}>
              <LeafletTooltip>{s.name}</LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}