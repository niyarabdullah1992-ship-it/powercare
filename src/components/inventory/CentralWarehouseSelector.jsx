import React from "react";
import { Building2 } from "lucide-react";

export default function CentralWarehouseSelector({ stations, value, onChange, ar }) {
  const selected = stations.find((station) => station.stationId === value || station.id === value);
  return <div className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4 text-accent" />{ar ? "المستودع المركزي" : "Central warehouse"}</div><select value={selected?.id || ""} onChange={(event) => onChange(event.target.value)} className="flex-1 rounded-lg border px-3 py-2 text-sm"><option value="">{ar ? "اختر المستودع المركزي" : "Choose central warehouse"}</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></div>;
}