import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ExportButtons from "@/components/individual/ExportButtons";
import NiroPlanBox from "@/components/individual/NiroPlanBox";
import DayTimeGrid from "@/components/individual/DayTimeGrid";
import DayLinksBar from "@/components/individual/DayLinksBar";
import PlannerTemplates from "@/components/individual/PlannerTemplates";
import usePersonalTargets from "@/hooks/usePersonalTargets";

const uid = () => `pln_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function DayPlanner() {
  const { t, lang, dir } = useI18n();
  const { data, company } = useAuth();
  const ar = lang === "ar";
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const targets = usePersonalTargets();

  if (!data || !company) return null;

  const items = (data.plannerItems || [])
    .filter((i) => i.date === date)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const doneCount = items.filter((i) => i.done).length;
  const visits = (data.personalAttendance || []).filter((r) => r.date === date);

  const shiftDay = (delta) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(localDate(d));
  };

  const addItem = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    updateCompany(company.id, (d) => {
      d.plannerItems = d.plannerItems || [];
      d.plannerItems.push({ id: uid(), date, time, title: trimmed, done: false, createdAt: new Date().toISOString() });
    });
    // Google Calendar sync (best-effort — silent if not connected)
    base44.functions.invoke("calendarSync", { title: trimmed, date, time }).catch(() => {});
    setTitle("");
    setTime("");
  };

  const toggle = (id) => updateCompany(company.id, (d) => {
    const item = (d.plannerItems || []).find((x) => x.id === id);
    if (item) item.done = !item.done;
  });

  const remove = (id) => updateCompany(company.id, (d) => {
    d.plannerItems = (d.plannerItems || []).filter((x) => x.id !== id);
  });

  const applyTemplate = (tplItems) => updateCompany(company.id, (d) => {
    d.plannerItems = d.plannerItems || [];
    tplItems.forEach(([tm, ttl]) => d.plannerItems.push({ id: uid(), date, time: tm, title: ttl, done: false, createdAt: new Date().toISOString() }));
  });

  const dayLabel = new Date(date + "T00:00:00").toLocaleDateString(ar ? "ar-SA" : "en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={t("dayPlanner")}
        icon={CalendarDays}
        actions={
          <ExportButtons
            title={t("dayPlanner")}
            filename="my-day-planner"
            headers={[t("date"), t("timeLabel"), t("itemLabel"), t("status")]}
            rows={[...(data.plannerItems || [])]
              .sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")))
              .map((i) => [i.date, i.time || "", i.title, i.done ? t("doneMark") : t("notDoneMark")])}
            ar={ar}
          />
        }
      />

      {/* Date navigation */}
      <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDay(-1)} className="p-2 rounded-md hover:bg-muted" aria-label="previous day">
            <ChevronLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body bg-background" />
          <button onClick={() => shiftDay(1)} className="p-2 rounded-md hover:bg-muted" aria-label="next day">
            <ChevronRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </button>
          {date !== localDate() && (
            <button onClick={() => setDate(localDate())} className="px-3 py-1.5 rounded-full text-xs font-body border border-border hover:bg-muted">
              {t("today")}
            </button>
          )}
        </div>
        <p className="text-sm font-heading font-semibold">{dayLabel}</p>
      </div>

      {/* Day at a glance — links to tasks, visits and journal for this date */}
      <DayLinksBar date={date} data={data} targets={targets} ar={ar} hide={["planner"]} />

      {/* Progress */}
      {items.length > 0 && (
        <div className="p-4 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs font-body text-muted-foreground mb-2">
            <span>{t("dayProgress")}</span>
            <span>{doneCount}/{items.length}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${Math.round((doneCount / items.length) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Niro AI day planning */}
      <NiroPlanBox companyId={company.id} date={date} />

      {/* Add item */}
      <form onSubmit={addItem} className="p-4 rounded-2xl border border-border bg-card flex gap-2 flex-wrap">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body bg-background" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("plannerPlaceholder")}
          className="flex-1 min-w-[180px] px-3 py-2 rounded-md border border-input text-sm font-body bg-background"
        />
        <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent transition-colors">
          <Plus className="w-4 h-4" /> {t("add")}
        </button>
      </form>

      {/* Ready-made templates when the day is empty */}
      {items.length === 0 && <PlannerTemplates ar={ar} onApply={applyTemplate} />}

      {/* Hour grid — same schedule look as the company shift schedule */}
      <DayTimeGrid items={items} visits={visits} onToggle={toggle} onRemove={remove} onPickTime={setTime} ar={ar} />
    </div>
  );
}