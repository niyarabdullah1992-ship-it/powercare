import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { visibleStations } from "@/lib/permissions";
import { monthGridDays, taskStationId } from "@/lib/attendanceCalendar";
import MonthlyTaskCalendarGrid from "@/components/attendance/MonthlyTaskCalendarGrid";

export default function MonthlyTaskCalendar() {
  const { data, currentUser } = useAuth(); const { lang } = useI18n(); const ar = lang === "ar";
  const [cursor, setCursor] = useState(() => new Date()); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; setLoading(true); base44.functions.invoke("supabaseTargets", { action: "listTargets", userRole: currentUser.role, userId: currentUser.id, stationId: currentUser.stationId || null, managedStations: currentUser.managedStations || [] }).then((res) => { if (active) setTasks(res?.data?.targets || []); }).catch(() => { if (active) setTasks([]); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [currentUser.id]);
  const stationIds = useMemo(() => new Set(visibleStations(currentUser, data).map((station) => station.id)), [currentUser, data]);
  const visibleTasks = useMemo(() => tasks.filter((task) => stationIds.has(taskStationId(task, data))), [tasks, stationIds, data]);
  const ownStationId = currentUser.stationId || data.stations?.[0]?.id; const schedules = (data.schedules || []).filter((schedule) => schedule.stationId === ownStationId);
  const year = cursor.getFullYear(); const month = cursor.getMonth(); const days = monthGridDays(year, month);
  const label = new Date(year, month, 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  const move = (amount) => setCursor(new Date(year, month + amount, 1));
  return <section className="space-y-4 rounded-xl border border-accent/25 bg-card p-3 shadow-soft sm:p-5">
    <div className="flex items-center justify-between gap-3"><div><h3 className="font-heading text-xl font-semibold">{ar ? "تقويم مهام المحطة" : "Station task calendar"}</h3><p className="text-xs text-muted-foreground">{ar ? "مهامك مميزة بالذهبي، وتظهر أيام الراحة عند عدم وجود وردية." : "Your tasks are highlighted in gold; unscheduled days appear as weekly off."}</p></div><div className="flex items-center gap-1"><button onClick={() => move(-1)} className="rounded-md p-2 hover:bg-muted" aria-label="Previous month"><ChevronRight className="h-4 w-4 rtl:hidden" /><ChevronLeft className="hidden h-4 w-4 rtl:block" /></button><span className="min-w-32 text-center text-sm font-semibold capitalize">{label}</span><button onClick={() => move(1)} className="rounded-md p-2 hover:bg-muted" aria-label="Next month"><ChevronLeft className="h-4 w-4 rtl:hidden" /><ChevronRight className="hidden h-4 w-4 rtl:block" /></button></div></div>
    {loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div> : <MonthlyTaskCalendarGrid days={days} tasks={visibleTasks} schedules={schedules} user={currentUser} lang={lang} />}
  </section>;
}