import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2 } from "lucide-react";
import { resolveStationPositions } from "@/lib/geocodeStations";
import FullscreenMapControl from "@/components/maps/FullscreenMapControl";

const LEVEL_COLORS = {
  red: { color: "#b91c1c", fill: "#ef4444" },
  amber: { color: "#b45309", fill: "#f59e0b" },
  green: { color: "#15803d", fill: "#22c55e" },
  none: { color: "#a9782f", fill: "#c99b4f" },
};

// Full-width executive map — every station as a marker colored by its safety level.
export default function ExecStationsMap({ stations, safety, lang }) {
  const ar = lang === "ar";
  const [located, setLocated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resolveStationPositions(stations).then((rows) => { if (!cancelled) setLocated(rows); });
    return () => { cancelled = true; };
  }, [stations.map((s) => `${s.id}:${s.lat},${s.lng},${s.location || ""}`).join("|")]);

  const rows = located || [];
  const center = rows.length ? [rows[0].lat, rows[0].lng] : [24.7136, 46.6753];
  const levelOf = (id) => (safety || []).find((r) => r.stationId === id)?.level || "none";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <h3 className="font-heading text-base font-semibold">{ar ? "خريطة المحطات المباشرة" : "Live Stations Map"}</h3>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-body text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> {ar ? "آمنة" : "Safe"}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> {ar ? "متابعة" : "Watch"}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {ar ? "حرجة" : "Critical"}</span>
        </div>
      </div>
      {located === null ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm font-body text-muted-foreground">{ar ? "لا توجد مواقع محددة للمحطات بعد" : "No station locations set yet"}</p>
      ) : (
        <MapContainer key={rows.map((s) => s.id).join(",")} center={center} zoom={rows.length > 1 ? 5 : 10} style={{ height: 340, width: "100%" }} scrollWheelZoom={false} attributionControl={false}>
          <FullscreenMapControl />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {rows.map((s) => {
            const c = LEVEL_COLORS[levelOf(s.id)];
            return (
              <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={9} pathOptions={{ color: c.color, fillColor: c.fill, fillOpacity: 0.9, weight: 2 }}>
                <LeafletTooltip>{s.name}</LeafletTooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}