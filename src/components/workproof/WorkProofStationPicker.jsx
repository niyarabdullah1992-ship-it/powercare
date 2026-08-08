import React from "react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Station-first entry: pick the station, then open its work-proof register.
export default function WorkProofStationPicker({ stations, counts, ar, onSelect }) {
  const { dir } = useI18n();
  const Arrow = dir === "rtl" ? ChevronLeft : ChevronRight;

  if (!stations.length) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground font-body">
        {ar ? "لا توجد محطات متاحة لك." : "No stations available for you."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => {
        const stat = counts[station.stationId] || { total: 0, open: 0 };
        return (
          <button
            key={station.stationId}
            onClick={() => onSelect(station.stationId)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-start transition hover:border-accent/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-base font-semibold">{station.name}</span>
              <span className="block text-xs text-muted-foreground font-body">
                {stat.total} {ar ? "سجل" : "records"} · {stat.open} {ar ? "قيد التنفيذ" : "in progress"}
              </span>
            </span>
            <Arrow className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}