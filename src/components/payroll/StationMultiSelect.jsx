import React from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

export default function StationMultiSelect({ stations, value, onChange, ar }) {
  const selected = stations.filter((station) => value.includes(station.id));
  const label = selected.length === 0
    ? (ar ? "جميع المحطات" : "All stations")
    : selected.length === 1
      ? selected[0].name
      : (ar ? `${selected.length} محطات` : `${selected.length} stations`);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-body hover:bg-secondary">
        <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <span className="max-w-36 truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </summary>
      <div className="absolute end-0 z-30 mt-2 min-w-56 rounded-xl border border-border bg-popover p-2 shadow-elevated">
        <button type="button" onClick={() => onChange([])} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-secondary">
          <span>{ar ? "جميع المحطات" : "All stations"}</span>
          {value.length === 0 && <Check className="h-4 w-4 text-accent" />}
        </button>
        <div className="my-1 border-t border-border" />
        {stations.map((station) => (
          <button key={station.id} type="button" onClick={() => toggle(station.id)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm hover:bg-secondary">
            <span className="truncate">{station.name}</span>
            {value.includes(station.id) && <Check className="h-4 w-4 shrink-0 text-accent" />}
          </button>
        ))}
      </div>
    </details>
  );
}