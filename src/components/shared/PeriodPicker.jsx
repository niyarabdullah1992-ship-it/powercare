import React from "react";
import { Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePeriod } from "@/lib/PeriodContext";
import { PERIODS, SHORT_PERIODS, periodLabel } from "@/lib/periods";

// The one period bar used by every section. daily/weekly are opt-in.
export default function PeriodPicker({ showDaily = false, showWeekly = false }) {
  const { lang } = useI18n();
  const { period, from, to, setPeriod, resolved } = usePeriod();

  const options = [
    ...SHORT_PERIODS.filter((p) => (p.id === "daily" && showDaily) || (p.id === "weekly" && showWeekly)),
    ...PERIODS,
  ];
  // One source of truth for validity — a half-filled range is invalid too.
  const invalidRange = period === "custom" && !resolved.valid;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setPeriod(option.id, { from, to })}
            className={`px-3.5 min-h-[40px] rounded-lg text-sm font-body border transition-colors ${
              period === option.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {periodLabel(option.id, lang)}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            aria-label={lang === "ar" ? "من تاريخ" : "From date"}
            max={to ? to.slice(0, 10) : undefined}
            value={from ? from.slice(0, 10) : ""}
            onChange={(e) => setPeriod("custom", { from: e.target.value, to })}
            className="px-2.5 min-h-[40px] rounded-lg border border-input text-sm font-body"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="date"
            aria-label={lang === "ar" ? "إلى تاريخ" : "To date"}
            min={from ? from.slice(0, 10) : undefined}
            value={to ? to.slice(0, 10) : ""}
            onChange={(e) => setPeriod("custom", { from, to: e.target.value })}
            className="px-2.5 min-h-[40px] rounded-lg border border-input text-sm font-body"
          />
          {invalidRange && (
            <span className="text-xs text-destructive font-body">
              {lang === "ar" ? "أكمل اختيار التاريخين — النهاية بعد البداية" : "Select both dates — end after start"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}