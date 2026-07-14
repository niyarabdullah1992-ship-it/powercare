import React from "react";

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Month calendar grid — colored dots mark planner items, journal entries and visits.
export default function MonthGrid({ year, month, selected, onSelect, marks, t }) {
  const startPad = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const fmt = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const weekdays = [t("daySun"), t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"), t("dayFri"), t("daySat")];
  const today = localDate();

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((w) => (
          <p key={w} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-body py-1 truncate px-0.5">{w}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dstr = fmt(i + 1);
          const m = marks[dstr];
          const isSel = selected === dstr;
          return (
            <button
              key={dstr}
              onClick={() => onSelect(dstr)}
              className={`min-h-[52px] p-1.5 rounded-lg border text-sm font-body transition flex flex-col items-center justify-between ${
                isSel ? "bg-foreground text-background border-foreground" : dstr === today ? "border-accent bg-accent/10 hover:bg-accent/20" : "border-border bg-background hover:bg-muted"
              }`}
            >
              <span>{i + 1}</span>
              <span className="flex gap-0.5">
                {m?.p ? <span className="w-1.5 h-1.5 rounded-full bg-accent" /> : null}
                {m?.j ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> : null}
                {m?.v ? <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> : null}
                {m?.t ? <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}