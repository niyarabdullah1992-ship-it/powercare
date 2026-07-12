import React, { useState } from "react";
import { Check, X, MapPin } from "lucide-react";

// Inline editor for a station's fixed GPS coordinates + allowed check-in radius —
// used by attendance location verification to flag employees as inside/outside.
export default function StationLocationEditor({ t, station, onSave, onCancel }) {
  const [lat, setLat] = useState(station.lat ?? "");
  const [lng, setLng] = useState(station.lng ?? "");
  const [radius, setRadius] = useState(station.radiusMeters ?? 200);

  const submit = () => {
    onSave({
      lat: lat === "" ? null : Number(lat),
      lng: lng === "" ? null : Number(lng),
      radiusMeters: Number(radius) || 200,
    });
  };

  return (
    <div className="space-y-2 p-2 rounded-md border border-border bg-background">
      <div className="grid grid-cols-2 gap-1.5">
        <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder={t("stationLat")} className="px-2 py-1 rounded-md border border-input text-xs font-body" />
        <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder={t("stationLng")} className="px-2 py-1 rounded-md border border-input text-xs font-body" />
      </div>
      <div className="flex items-center gap-1.5">
        <input type="number" min="10" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder={t("stationRadius")} className="flex-1 px-2 py-1 rounded-md border border-input text-xs font-body" />
        <span className="text-[10px] text-muted-foreground shrink-0">{t("metersUnit")}</span>
        <button onClick={submit} className="p-1 rounded-md hover:bg-accent/10 text-accent"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={onCancel} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}