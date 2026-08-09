import React from "react";
import { Calendar, Check } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { usePerformancePeriod } from "@/lib/PerformancePeriodContext";
import { PERIOD_PRESETS, presetLabel, formatRangeText } from "@/lib/performancePeriod";

// One range dropdown + an explicit comparison switch. Grouping is derived, so it
// is never offered as a choice.
export default function PeriodSelector({ ar }) {
  const { preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd, compare, setCompare, resolved } = usePerformancePeriod();

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-body">
          <Calendar className="h-4 w-4" />{ar ? "الفترة" : "Period"}
        </span>
        <MobileSelect
          value={preset}
          onChange={setPreset}
          options={PERIOD_PRESETS.map((p) => ({ value: p.val, label: presetLabel(p.val, ar) }))}
          placeholder={ar ? "اختر الفترة" : "Select period"}
          className="min-w-[11rem]"
        />
        {preset === "custom" && (
          <span className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-md border border-input px-2.5 py-1.5 text-xs font-body" />
            <span className="text-xs text-muted-foreground">—</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-md border border-input px-2.5 py-1.5 text-xs font-body" />
          </span>
        )}
        <button
          type="button"
          onClick={() => setCompare(!compare)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body transition ${compare ? "border-accent bg-accent/10 text-accent-text" : "border-border hover:bg-muted"}`}
        >
          <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border ${compare ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}>
            {compare && <Check className="h-2.5 w-2.5" />}
          </span>
          {ar ? "مقارنة بالفترة السابقة" : "Compare to previous period"}
        </button>
      </div>
      <p className="mt-2 ps-1 text-xs text-muted-foreground font-body" dir="auto">
        {formatRangeText(resolved.start, resolved.end, ar)}
        {compare && <> · {ar ? "مقارنة بـ" : "vs"} {formatRangeText(resolved.previousStart, resolved.previousEnd, ar)}</>}
      </p>
    </div>
  );
}