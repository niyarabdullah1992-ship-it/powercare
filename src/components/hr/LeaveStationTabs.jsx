import React from "react";
import { Radio } from "lucide-react";

// Station selector for the leaves & requests page — "all" plus one chip per station.
export default function LeaveStationTabs({ stations, value, onChange, counts, ar }) {
  const options = [{ id: "all", name: ar ? "كل المحطات" : "All stations" }, ...stations];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((station) => (
        <button
          key={station.id}
          type="button"
          onClick={() => onChange(station.id)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body transition ${value === station.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
        >
          <Radio className="h-3.5 w-3.5" /> {station.name}
          <span className="opacity-70">({counts[station.id] || 0})</span>
        </button>
      ))}
    </div>
  );
}