import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { Link } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Circle, BookOpen, MapPin, Target } from "lucide-react";
import usePersonalTargets from "@/hooks/usePersonalTargets";
import PageHeader from "@/components/PageHeader";
import MonthGrid from "@/components/individual/MonthGrid";
import ExportButtons from "@/components/individual/ExportButtons";
import { MOODS } from "@/pages/LifeJournal";

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Unified monthly calendar for individuals: planner items + journal entries + visits.
export default function MonthlyCalendar() {
  const { t, lang, dir } = useI18n();
  const { data } = useAuth();
  const ar = lang === "ar";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(localDate());
  const targets = usePersonalTargets();

  if (!data) return null;

  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const plans = (data.plannerItems || []).filter((i) => (i.date || "").startsWith(prefix));
  const journal = (data.journalEntries || []).filter((e) => (e.date || "").startsWith(prefix));
  const visits = (data.personalAttendance || []).filter((r) => (r.date || "").startsWith(prefix));
  const taskDate = (tg) => (tg.end_date || "").slice(0, 10);
  const monthTasks = targets.filter((tg) => taskDate(tg).startsWith(prefix));

  const marks = {};
  const mark = (date, key) => { marks[date] = marks[date] || {}; marks[date][key] = (marks[date][key] || 0) + 1; };
  plans.forEach((i) => mark(i.date, "p"));
  journal.forEach((e) => mark(e.date, "j"));
  visits.forEach((r) => mark(r.date, "v"));
  monthTasks.forEach((tg) => mark(taskDate(tg), "t"));

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(ar ? "ar-SA" : lang, { month: "long", year: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const moodOf = (key) => { const m = MOODS.find((x) => x.key === key); return m ? `${m.emoji} ${t(m.labelKey)}` : ""; };

  // Combined month export — one row per event, sorted by date.
  const exportRows = [
    ...plans.map((i) => [i.date, t("dayPlanner"), i.time || "", i.title, i.done ? t("doneMark") : t("notDoneMark")]),
    ...journal.map((e) => [e.date, t("lifeJournal"), "", e.text, moodOf(e.mood)]),
    ...visits.map((r) => [r.date, t("visitsLabel"), fmtTime(r.checkIn), r.place || "", r.checkOut ? fmtTime(r.checkOut) : t("indOngoing")]),
    ...monthTasks.map((tg) => [taskDate(tg), t("myTasks"), "", tg.title || "", tg.status === "completed" ? t("completed") : t("inProgress")]),
  ].sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const dayPlans = plans.filter((i) => i.date === selected).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const dayJournal = journal.filter((e) => e.date === selected);
  const dayVisits = visits.filter((r) => r.date === selected);
  const dayTasks = monthTasks.filter((tg) => taskDate(tg) === selected);
  const dayEmpty = dayPlans.length + dayJournal.length + dayVisits.length + dayTasks.length === 0;
  const selectedLabel = new Date(selected + "T00:00:00").toLocaleDateString(ar ? "ar-SA" : lang, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={t("monthlyCalendar")}
        icon={Calendar}
        description={t("monthlyCalendarDesc")}
        actions={
          <ExportButtons
            title={`${t("monthlyCalendar")} — ${monthLabel}`}
            filename={`monthly-calendar-${prefix}`}
            headers={[t("date"), t("typeLabel"), t("timeLabel"), t("detailsLabel"), t("status")]}
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
        <MonthGrid year={year} month={month} selected={selected} onSelect={setSelected} marks={marks} t={t} />
        <div className="flex flex-wrap gap-4 pt-1 text-xs font-body text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> {t("dayPlanner")}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {t("lifeJournal")}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> {t("visitsLabel")}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {t("myTasks")}</span>
        </div>
      </div>

      {/* Selected day details */}
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-heading font-semibold">{selectedLabel}</h3>
        {dayEmpty ? (
          <p className="text-sm text-muted-foreground font-body">{t("noActivityDay")}</p>
        ) : (
          <>
            {dayTasks.map((tg) => (
              <Link key={tg.id} to="/app/tasks" className="flex items-center gap-2.5 text-sm font-body hover:underline">
                <Target className="w-4 h-4 text-amber-600 shrink-0" />
                <span className={`min-w-0 truncate ${tg.status === "completed" ? "line-through opacity-60" : ""}`}>{tg.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{tg.status === "completed" ? t("completed") : t("inProgress")}</span>
              </Link>
            ))}
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