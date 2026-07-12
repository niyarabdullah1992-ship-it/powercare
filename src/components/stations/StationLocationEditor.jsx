import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import GoogleTiles from "@/components/maps/GoogleTiles";
import LocationSearchBox from "@/components/maps/LocationSearchBox";
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

  const watchRef = useRef(null);
  const bestRef = useRef(null);

  const stopTracking = () => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setLocating(false);
  };

  useEffect(() => stopTracking, []);

  // Live high-accuracy tracking — keeps watching the GPS and moving the marker
  // every time a more precise fix arrives (instead of one coarse Wi-Fi/IP reading),
  // stopping automatically once the fix is truly precise.
  const useMyLocation = () => {
    setError("");
    setAccuracy(null);
    bestRef.current = null;
    if (!navigator.geolocation) { setError(t("locationDenied")); return; }
    stopTracking();
    setLocating(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? null };
        const best = bestRef.current;
        if (!best || (fix.accuracy != null && (best.accuracy == null || fix.accuracy < best.accuracy))) {
          bestRef.current = fix;
          setPos([fix.lat, fix.lng]);
          setAccuracy(fix.accuracy != null ? Math.round(fix.accuracy) : null);
        }
        if (bestRef.current.accuracy != null && bestRef.current.accuracy <= 10) stopTracking();
      },
      () => {
        stopTracking();
        if (!bestRef.current) setError(t("locationDenied"));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
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
            onClick={locating ? stopTracking : useMyLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 text-accent text-xs font-body hover:bg-accent/20 shrink-0"
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
            {locating ? `${t("locating")}${accuracy != null ? ` ±${accuracy}${t("metersUnit")}` : ""}` : t("useMyLocation")}
          </button>
        </div>

        <div className="px-4 py-2 border-b border-border">
          <LocationSearchBox t={t} onPick={(p) => { stopTracking(); setAccuracy(null); setPos(p); }} />
        </div>

        <div className="h-72 relative">
          <MapContainer center={pos || DEFAULT_CENTER} zoom={pos ? 17 : 6} style={{ height: "100%", width: "100%" }}>
            <GoogleTiles />
            <ClickToPlace onPick={(p) => { stopTracking(); setAccuracy(null); setPos(p); }} />
            <Recenter pos={pos} />
            {pos && accuracy != null && (
              <Circle center={pos} radius={accuracy} pathOptions={{ color: "#3b82f6", weight: 1, fillOpacity: 0.08 }} />
            )}
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