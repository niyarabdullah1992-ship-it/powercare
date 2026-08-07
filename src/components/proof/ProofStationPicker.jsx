import React, { useMemo, useState } from "react";
import { Building2, FileCheck2, Search } from "lucide-react";

// كل محطة لها مساحة إثبات وأرشيف خاص — مع بحث ذكي فوري بين المحطات.
export default function ProofStationPicker({ stations, value, onChange, countFor, ar }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? stations.filter((station) => (station.name || "").toLowerCase().includes(term)) : stations;
  }, [stations, query]);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="relative">
        <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={ar ? "ابحث عن محطة" : "Search a station"}
          className="w-full rounded-md border border-input py-2 pe-3 ps-9 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((station) => (
          <button
            key={station.id}
            type="button"
            onClick={() => onChange(station.id)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-start transition ${
              value === station.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent"><Building2 className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{station.name}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><FileCheck2 className="h-3 w-3" /> {countFor(station.id)} {ar ? "إثبات" : "proofs"}</span>
            </span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">{ar ? "لا توجد محطات مطابقة" : "No matching stations"}</p>}
      </div>
    </section>
  );
}