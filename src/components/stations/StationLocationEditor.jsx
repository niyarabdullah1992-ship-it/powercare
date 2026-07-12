import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { getAccuratePosition } from "@/lib/geo";
import GoogleTiles from "@/components/maps/GoogleTiles";
import { X, MapPin, LocateFixed, Loader2, Check } from "lucide-react";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [24.7136, 46.6753]; // Riyadh

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Recenter({ pos }) {
  const map = useMap();
  React.useEffect(() => {
    if (pos) map.setView(pos, Math.max(map.getZoom(), 15));
  }, [pos?.[0], pos?.[1]]);
  return null;
}

// Smart map-based picker for a station's GPS location + allowed check-in radius:
// tap the map to place the marker, or use the device's current location — no
// manual coordinate typing needed.
export default function StationLocationEditor({ t, station, onSave, onCancel }) {
  const [pos, setPos] = useState(station.lat != null && station.lng != null ? [station.lat, station.lng] : null);
  const [radius, setRadius] = useState(station.radiusMeters ?? 200);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState("");

  // Uses high-accuracy GPS tracking (watchPosition) — keeps refining the fix
  // until it's precise instead of accepting the first coarse Wi-Fi/IP reading.
  const useMyLocation = async () => {
    setError("");
    setAccuracy(null);
    if (!navigator.geolocation) { setError(t("locationDenied")); return; }
    setLocating(true);
    const fix = await getAccuratePosition({ timeoutMs: 20000 });
    setLocating(false);
    if (!fix) { setError(t("locationDenied")); return; }
    setPos([fix.lat, fix.lng]);
    setAccuracy(fix.accuracy != null ? Math.round(fix.accuracy) : null);
  };

  const submit = () => {
    onSave({
      lat: pos ? pos[0] : null,
      lng: pos ? pos[1] : null,
      radiusMeters: Number(radius) || 200,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" /> {t("setLocation")} — <span dir="auto">{station.name}</span>
          </h3>
          <button onClick={onCancel} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-4 py-2 flex items-center justify-between gap-2 border-b border-border">
          <p className="text-[11px] text-muted-foreground font-body">{t("tapMapToSet")}</p>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 text-accent text-xs font-body hover:bg-accent/20 disabled:opacity-50 shrink-0"
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
            {t("useMyLocation")}
          </button>
        </div>

        <div className="h-72 relative">
          <MapContainer center={pos || DEFAULT_CENTER} zoom={pos ? 17 : 6} style={{ height: "100%", width: "100%" }}>
            <GoogleTiles />
            <ClickToPlace onPick={setPos} />
            <Recenter pos={pos} />
            {pos && <Marker position={pos} icon={markerIcon} />}
            {pos && <Circle center={pos} radius={Number(radius) || 200} pathOptions={{ color: "#b07d3f", fillOpacity: 0.12 }} />}
          </MapContainer>
        </div>

        <div className="px-4 py-3 space-y-2 border-t border-border">
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
          {accuracy != null && (
            <p className={`text-xs font-body ${accuracy <= 30 ? "text-emerald-600" : "text-amber-600"}`}>
              {t("gpsAccuracy")}: ±{accuracy}{t("metersUnit")}{accuracy > 30 ? ` — ${t("lowAccuracyHint")}` : ""}
            </p>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-body shrink-0">{t("stationRadius")}</label>
            <input
              type="number" min="10"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-24 px-2 py-1.5 rounded-md border border-input text-sm font-body"
            />
            <span className="text-xs text-muted-foreground font-body">{t("metersUnit")}</span>
            <div className="ms-auto flex items-center gap-2">
              <button onClick={onCancel} className="px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">{t("cancel")}</button>
              <button
                onClick={submit}
                disabled={!pos}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> {t("save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}