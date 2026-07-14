import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Circle, BookOpen, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MonthGrid from "@/components/individual/MonthGrid";
import ExportButtons from "@/components/individual/ExportButtons";
import { MOODS } from "@/pages/LifeJournal";

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Unified monthly calendar for individuals: planner items + journal entries + visits.
export default function MonthlyCalendar() {
  const { lang, dir } = useI18n();
  const { data } = useAuth();
  const ar = lang === "ar";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(localDate());

  if (!data) return null;

  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const plans = (data.plannerItems || []).filter((i) => (i.date || "").startsWith(prefix));
  const journal = (data.journalEntries || []).filter((e) => (e.date || "").startsWith(prefix));
  const visits = (data.personalAttendance || []).filter((r) => (r.date || "").startsWith(prefix));

  const marks = {};
  const mark = (date, key) => { marks[date] = marks[date] || {}; marks[date][key] = (marks[date][key] || 0) + 1; };
  plans.forEach((i) => mark(i.date, "p"));
  journal.forEach((e) => mark(e.date, "j"));
  visits.forEach((r) => mark(r.date, "v"));

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(ar ? "ar-SA" : "en-GB", { month: "long", year: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const moodOf = (key) => { const m = MOODS.find((x) => x.key === key); return m ? `${m.emoji} ${ar ? m.ar : m.en}` : ""; };

  // Combined month export — one row per event, sorted by date.
  const exportRows = [
    ...plans.map((i) => [i.date, ar ? "مخطط اليوم" : "Planner", i.time || "", i.title, i.done ? (ar ? "منجز ✓" : "Done ✓") : (ar ? "غير منجز" : "Not done")]),
    ...journal.map((e) => [e.date, ar ? "يوميات" : "Journal", "", e.text, moodOf(e.mood)]),
    ...visits.map((r) => [r.date, ar ? "زيارة" : "Visit", fmtTime(r.checkIn), r.place || "", r.checkOut ? fmtTime(r.checkOut) : (ar ? "جارٍ" : "ongoing")]),
  ].sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const dayPlans = plans.filter((i) => i.date === selected).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const dayJournal = journal.filter((e) => e.date === selected);
  const dayVisits = visits.filter((r) => r.date === selected);
  const dayEmpty = dayPlans.length + dayJournal.length + dayVisits.length === 0;
  const selectedLabel = new Date(selected + "T00:00:00").toLocaleDateString(ar ? "ar-SA" : "en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={ar ? "التقويم الشهري" : "Monthly Calendar"}
        icon={Calendar}
        description={ar ? "مهامك ويومياتك وزياراتك في مكان واحد." : "Your plans, journal and visits in one place."}
        actions={
          <ExportButtons
            title={`${ar ? "التقويم الشهري" : "Monthly Calendar"} — ${monthLabel}`}
            filename={`monthly-calendar-${prefix}`}
            headers={ar ? ["التاريخ", "النوع", "الوقت", "التفاصيل", "الحالة"] : ["Date", "Type", "Time", "Details", "Status"]}
            rows={exportRows}
            ar={ar}
          />
        }
      />

      {/* Month navigation + grid */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => shiftMonth(-1)} className="p-2 rounded-md hover:bg-muted" aria-label="previous month">
            <ChevronLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </button>
          <p className="font-heading font-semibold">{monthLabel}</p>
          <button onClick={() => shiftMonth(1)} className="p-2 rounded-md hover:bg-muted" aria-label="next month">
            <ChevronRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </button>
        </div>
        <MonthGrid year={year} month={month} selected={selected} onSelect={setSelected} marks={marks} ar={ar} />
        <div className="flex flex-wrap gap-4 pt-1 text-xs font-body text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> {ar ? "مخطط اليوم" : "Planner"}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {ar ? "يوميات" : "Journal"}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> {ar ? "زيارات" : "Visits"}</span>
        </div>
      </div>

      {/* Selected day details */}
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-heading font-semibold">{selectedLabel}</h3>
        {dayEmpty ? (
          <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد أنشطة في هذا اليوم." : "No activity on this day."}</p>
        ) : (
          <>
            {dayPlans.map((i) => (
              <div key={i.id} className="flex items-center gap-2.5 text-sm font-body">
                {i.done ? <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                {i.time && <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs" dir="ltr">{i.time}</span>}
                <span className={i.done ? "line-through opacity-60" : ""}>{i.title}</span>
              </div>
            ))}
            {dayJournal.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5 text-sm font-body">
                <BookOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="min-w-0"><span className="text-xs text-muted-foreground">{moodOf(e.mood)}</span> — {e.text}</p>
              </div>
            ))}
            {dayVisits.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 text-sm font-body">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{r.place || "—"}</span>
                <span className="text-xs text-muted-foreground" dir="ltr">{fmtTime(r.checkIn)}{r.checkOut ? ` → ${fmtTime(r.checkOut)}` : ""}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}