import React from "react";
import { MapContainer, Marker, Popup } from "react-leaflet";
import GoogleTiles from "@/components/maps/GoogleTiles";
import L from "leaflet";
import { X } from "lucide-react";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Shows the employee's check-in point vs. the station's fixed location on a map —
// opened from the manager's daily attendance table.
export default function LocationMapModal({ row, t, onClose }) {
  const empPos = row.check_in_lat != null && row.check_in_lng != null ? [row.check_in_lat, row.check_in_lng] : null;
  const checkoutPos = row.check_out_lat != null && row.check_out_lng != null ? [row.check_out_lat, row.check_out_lng] : null;
  const stationPos = row.station_lat != null && row.station_lng != null ? [row.station_lat, row.station_lng] : null;
  const center = empPos || checkoutPos || stationPos || [0, 0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm">{t("employeeLocation")} / {t("stationLocation")}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-2 text-xs font-body text-muted-foreground border-b border-border">
          {t("distanceMeters")}: {row.distance_meters ?? "—"}m
        </div>
        <div className="h-72 relative">
          <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
            <GoogleTiles />
            {empPos && <Marker position={empPos} icon={markerIcon}><Popup>{t("checkIn")} — {t("employeeLocation")}</Popup></Marker>}
            {checkoutPos && <Marker position={checkoutPos} icon={markerIcon}><Popup>{t("checkOut")} — {t("employeeLocation")}</Popup></Marker>}
            {stationPos && <Marker position={stationPos} icon={markerIcon}><Popup>{t("stationLocation")}</Popup></Marker>}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}