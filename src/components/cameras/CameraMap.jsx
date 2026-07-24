import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import GoogleTiles from "@/components/maps/GoogleTiles";
import { resolveStationPositions } from "@/lib/geocodeStations";

const safe = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const stationIcon = (name) => divIcon({ className: "", iconSize: [160, 68], iconAnchor: [80, 21], html: `<div style="display:flex;flex-direction:column;align-items:center;width:160px;gap:4px"><div style="display:grid;place-items:center;width:42px;height:42px;border-radius:999px;border:3px solid hsl(var(--accent));background:hsl(var(--primary));color:hsl(var(--primary-foreground));box-shadow:0 5px 16px rgba(0,0,0,.3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7.7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.7z"/><circle cx="12" cy="13" r="3"/></svg></div><span style="padding:3px 8px;border-radius:6px;background:hsl(var(--card));color:hsl(var(--foreground));border:1px solid hsl(var(--border));font:600 11px sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.18)">${safe(name)}</span></div>` });

export default function CameraMap({ cameras, stations, ar, onSelectStation }) {
  const [located, setLocated] = useState(null);
  useEffect(() => {
    let cancelled = false;
    resolveStationPositions(stations).then((rows) => { if (!cancelled) setLocated(rows); });
    return () => { cancelled = true; };
  }, [stations.map((station) => `${station.id}:${station.lat},${station.lng},${station.location || ""}`).join("|")]);
  const groups = (located || []).map((station) => ({ station, items: cameras.filter((camera) => camera.stationId === station.id), lat: station.lat, lng: station.lng }));
  const center = groups.length ? [groups[0].lat, groups[0].lng] : [24.7136, 46.6753];
  return <section className="overflow-hidden rounded-xl border border-border bg-card"><div className="border-b border-border p-4"><h2 className="font-heading text-lg font-semibold">{ar ? "خريطة محطات الكاميرات" : "Camera station map"}</h2><p className="text-xs text-muted-foreground">{ar ? `${groups.length} محطة على الخريطة` : `${groups.length} stations on the map`}</p></div><MapContainer key={groups.map((group) => `${group.station.id}:${group.lat},${group.lng}`).join("|") || "empty"} center={center} zoom={groups.length > 1 ? 5 : groups.length ? 13 : 6} className="h-[360px] w-full" scrollWheelZoom zoomAnimation={false} markerZoomAnimation={false} fadeAnimation={false}><GoogleTiles />{groups.map(({ station, items, lat, lng }) => <Marker key={station.id} position={[lat, lng]} icon={stationIcon(station.name)} eventHandlers={{ click: () => onSelectStation?.(station.id) }}><Popup><div className="min-w-44"><strong>{station.name}</strong><p>{ar ? `${items.length} كاميرا` : `${items.length} cameras`}</p>{items.length ? <ul>{items.map((camera) => <li key={camera.id}>• {camera.name} — {camera.status === "active" ? (ar ? "نشطة" : "Active") : (ar ? "متوقفة" : "Offline")}</li>)}</ul> : <p>{ar ? "لا توجد كاميرات مضافة لهذه المحطة" : "No cameras added to this station"}</p>}</div></Popup></Marker>)}</MapContainer></section>;
}