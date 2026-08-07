import React from "react";
import { Building2, FileCheck2 } from "lucide-react";

// Each station gets its own proof workspace: issue new proofs and browse its archive.
export default function ProofStationPicker({ stations, value, onChange, countFor, ar }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{ar ? "اختر المحطة" : "Select a station"}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => (
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
        {stations.length === 0 && <p className="text-sm text-muted-foreground">{ar ? "لا توجد محطات" : "No stations"}</p>}
      </div>
    </section>
  );
}