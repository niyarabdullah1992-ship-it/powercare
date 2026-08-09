import React from "react";
import { Calendar } from "lucide-react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

// The period control governs everything below it, so it sits first — with the
// single export for the whole screen beside it.
export default function TrendPeriodBar({ ranges, range, onRange, rangeLabel, customStart, customEnd, onCustomStart, onCustomEnd, exportProps }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {ranges.map((r) => (
          <button
            key={r.val}
            onClick={() => onRange(r.val)}
            className={`rounded-full border px-3 py-1.5 text-xs font-body transition ${range === r.val ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            {rangeLabel(r.val)}
          </button>
        ))}
        {range === "custom" && (
          <span className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={(e) => onCustomStart(e.target.value)} className="rounded-md border border-input px-2.5 py-1.5 text-xs font-body" />
            <span className="text-xs text-muted-foreground">—</span>
            <input type="date" value={customEnd} onChange={(e) => onCustomEnd(e.target.value)} className="rounded-md border border-input px-2.5 py-1.5 text-xs font-body" />
          </span>
        )}
      </div>
      <ComparisonExportButtons {...exportProps} />
    </div>
  );
}