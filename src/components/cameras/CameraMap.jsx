import React from "react";
import { CircleMarker, MapContainer, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import GoogleTiles from "@/components/maps/GoogleTiles";

export default function CameraMap({ cameras, stations, ar }) {
  const points = cameras.map((camera) => { const station = stations.find((item) => item.id === camera.stationId); return { ...camera, lat: Number(camera.lat ?? station?.lat), lng: Number(camera.lng ?? station?.lng), station }; }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const center = points.length ? [points[0].lat, points[0].lng] : [24.7136, 46.6753];
  return <section className="overflow-hidden rounded-xl border border-border bg-card"><div className="border-b border-border p-4"><h2 className="font-heading text-lg font-semibold">{ar ? "خريطة الكاميرات" : "Camera map"}</h2><p className="text-xs text-muted-foreground">{ar ? `${points.length} كاميرا مرتبطة بموقع` : `${points.length} cameras with locations`}</p></div><MapContainer center={center} zoom={points.length ? 13 : 6} className="h-[360px] w-full" scrollWheelZoom><GoogleTiles />{points.map((camera) => <CircleMarker key={camera.id} center={[camera.lat, camera.lng]} radius={9} pathOptions={{ color: camera.status === "active" ? "#e0a43b" : "#64748b", fillOpacity: .9 }}><Popup><strong>{camera.name}</strong><br />{camera.station?.name || "—"}</Popup></CircleMarker>)}</MapContainer></section>;
}