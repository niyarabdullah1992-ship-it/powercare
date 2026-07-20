import React, { useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";

export default function InventoryStationMultiSelect({ stations, value, onChange, ar }) {
  const [query, setQuery] = useState("");
  const selected = stations.filter((station) => value.includes(station.stationId || station.id));
  const label = !value.length ? (ar ? "جميع المحطات" : "All stations") : selected.length === 1 ? selected[0].name : (ar ? `${selected.length} محطات` : `${selected.length} stations`);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((entry) => entry !== id) : [...value, id]);
  const visible = stations.filter((station) => `${station.name || ""} ${station.location || ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  return <details className="relative">
    <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm hover:bg-secondary">
      <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-accent" /><span className="truncate">{label}</span></span><ChevronDown className="h-4 w-4 text-muted-foreground" />
    </summary>
    <div className="absolute end-0 z-30 mt-2 w-full min-w-64 rounded-xl border border-border bg-popover p-2 shadow-elevated">
      <button type="button" onClick={() => onChange([])} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-secondary"><span>{ar ? "جميع المحطات" : "All stations"}</span>{!value.length && <Check className="h-4 w-4 text-accent" />}</button>
      <label className="relative my-1 block border-y border-border"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث عن محطة..." : "Search stations..."} className="h-10 w-full border-0 bg-popover pe-3 ps-9 text-sm focus-visible:ring-0" /></label>
      <div className="max-h-56 overflow-y-auto">{visible.map((station) => { const id = station.stationId || station.id; return <button key={id} type="button" onClick={() => toggle(id)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm hover:bg-secondary"><span className="truncate">{station.location ? `${station.name} — ${station.location}` : station.name}</span>{value.includes(id) && <Check className="h-4 w-4 shrink-0 text-accent" />}</button>; })}{!visible.length && <p className="px-3 py-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد محطة مطابقة" : "No matching station"}</p>}</div>
    </div>
  </details>;
}