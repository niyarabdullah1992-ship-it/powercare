import React from "react";
import { Warehouse } from "lucide-react";

export default function StationWarehousePicker({ stations, value, onChange, locked, ar }) {
  const selected = stations.find((station) => station.stationId === value);
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><Warehouse className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{ar ? "مخزن المحطة" : "Station warehouse"}</p>
      {locked ? <p className="truncate font-medium">{selected?.name || "—"}</p> : <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm">
        {stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}
      </select>}
    </div>
  </div>;
}