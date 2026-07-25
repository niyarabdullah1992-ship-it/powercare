import React, { useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";

export default function StationMultiSelect({ stations, value, onChange, ar }) {
  const [query, setQuery] = useState("");
  const selected = stations.filter((station) => value.includes(station.id));
  const label = selected.length === 0
    ? (ar ? "جميع المحطات" : "All stations")
    : selected.length === 1
      ? selected[0].name
      : (ar ? `${selected.length} محطات` : `${selected.length} stations`);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  const visibleStations = stations.filter((station) => `${station.name || ""} ${station.location || ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-secondary">
        <MapPin className="h-4 w-4 text-accent" strokeWidth={2} />
        <span className="max-w-36 truncate text-foreground">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-foreground/70" />
      </summary>
      <div className="absolute end-0 z-30 mt-2 min-w-56 rounded-xl border border-border bg-popover p-2 shadow-elevated">
        <button type="button" onClick={() => onChange([])} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-secondary">
          <span>{ar ? "جميع المحطات" : "All stations"}</span>
          {value.length === 0 && <Check className="h-4 w-4 text-accent" />}
        </button>
        <label className="relative my-1 block border-y border-border"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث عن محطة..." : "Search stations..."} className="h-10 w-full border-0 bg-popover pe-3 ps-9 text-sm focus-visible:ring-0" /></label>
        <div className="max-h-56 overflow-y-auto">
        {visibleStations.map((station) => (
          <button key={station.id} type="button" onClick={() => toggle(station.id)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm hover:bg-secondary">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{station.name}</span>
            </span>
            {value.includes(station.id) && <Check className="h-4 w-4 shrink-0 text-accent" />}
          </button>
        ))}
        {!visibleStations.length && <p className="px-3 py-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد محطة مطابقة" : "No matching station"}</p>}
        </div>
      </div>
    </details>
  );
}