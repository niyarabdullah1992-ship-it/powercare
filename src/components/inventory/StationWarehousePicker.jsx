import React from "react";
import { Warehouse } from "lucide-react";

export default function StationWarehousePicker({ stations, value, onChange, locked, ar }) {
  const stationId = (station) => station.stationId || station.id;
  const selected = stations.find((station) => stationId(station) === value);
  const stationLabel = (station) => !station ? "—" : station.location ? `${station.name} — ${station.location}` : station.name;
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><Warehouse className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{ar ? "موقع المخزون" : "Inventory location"}</p>
      {!stations.length ? <p className="mt-1 text-sm font-medium text-muted-foreground">{ar ? "لا توجد محطات متاحة. أضف محطة أولاً." : "No stations available. Add a station first."}</p> : locked ? <p className="mt-1 truncate font-medium">{stationLabel(selected)}</p> : <select aria-label={ar ? "اختر موقع المخزون" : "Choose inventory location"} value={selected ? value : ""} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium">
        <option value="" disabled>{ar ? "اختر المحطة" : "Choose a station"}</option>
        {stations.map((station) => <option key={stationId(station)} value={stationId(station)}>{stationLabel(station)}</option>)}
      </select>}
    </div>
  </div>;
}