import React from "react";
import moment from "moment";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// ‹ ٩ أغسطس ٢٠٢٦ › — day navigation for the daily report archive.
export default function DayNavigator({ day, setDay }) {
  const { lang, dir } = useI18n();
  const isToday = moment(day).isSame(moment(), "day");
  const shift = (n) => setDay(moment(day).add(n, "day").format("YYYY-MM-DD"));
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <button onClick={() => shift(-1)} className="p-2 rounded-md hover:bg-muted" aria-label={lang === "ar" ? "اليوم السابق" : "Previous day"}>
        <Prev className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <CalendarDays className="w-4 h-4 text-accent shrink-0" />
        <span className="font-heading text-base font-semibold truncate">
          {moment(day).locale(lang === "ar" ? "ar" : "en").format("D MMMM YYYY")}
        </span>
        {!isToday && (
          <button onClick={() => setDay(moment().format("YYYY-MM-DD"))} className="text-xs font-body px-2 py-1 rounded-md border border-border hover:bg-muted">
            {lang === "ar" ? "اليوم" : "Today"}
          </button>
        )}
      </div>
      <button onClick={() => shift(1)} disabled={isToday} className="p-2 rounded-md hover:bg-muted disabled:opacity-40" aria-label={lang === "ar" ? "اليوم التالي" : "Next day"}>
        <Next className="w-4 h-4" />
      </button>
    </div>
  );
}