import React, { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { visibleStations, canSeeAllStations } from "@/lib/permissions";
import moment from "moment";
import { FileText, ListTodo, AlertTriangle, Send } from "lucide-react";
import ReportCard from "@/components/reports/ReportCard";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/reports/DayNavigator";
import UnitSubmissionStrip from "@/components/reports/UnitSubmissionStrip";
import TimelineEntry from "@/components/reports/TimelineEntry";
import MobileSelect from "@/components/mobile/MobileSelect";
import { buildDailyTimeline } from "@/lib/dailyTimeline";
import { buildUnitStatuses, DEFAULT_REPORT_DUE_TIME } from "@/lib/unitReportingStatus";
import { updateCompany } from "@/lib/store";

export default function DailyReport() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(moment().format("YYYY-MM-DD"));
  const [activeStation, setActiveStation] = useState("all");

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("supabaseTargets", {
          action: "listTargets",
          userRole: currentUser.role,
          userId: currentUser.id,
          stationId: currentUser.stationId || null,
          managedStations: currentUser.managedStations || [],
        });
        setTargets(res?.data?.targets || []);
      } catch {
        setTargets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.id]);

  const seesAll = currentUser ? canSeeAllStations(currentUser) : false;
  const myStations = data && currentUser ? visibleStations(currentUser, data) : [];

  const stationOf = useMemo(() => {
    const defaultStationId = data?.stations?.[0]?.id || null;
    const empStation = (id) => data?.employees.find((e) => e.id === id)?.stationId || defaultStationId;
    return (tg) => {
      if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || null;
      if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || defaultStationId;
      if (tg.assignment_type === "hq_team") return defaultStationId;
      return tg.station_id || defaultStationId;
    };
  }, [data]);

  const timeline = useMemo(() => {
    if (!data || !currentUser) return [];
    const stationIds = new Set(myStations.map((s) => s.id));
    const defaultStationId = data.stations?.[0]?.id || null;
    const stationName = (id) => data.stations.find((s) => s.id === (id || defaultStationId))?.name || "—";
    const inScope = (key) => seesAll || stationIds.has(key);

    // Localized actor name + job title — never a raw English role key.
    const actorLabel = (c) => {
      const emp = data.employees.find((e) => e.id === c.user_id);
      if (emp) return emp.position ? `${emp.name} — ${emp.position}` : emp.name;
      if (!c.user_name || /^owner$/i.test(c.user_name)) return lang === "ar" ? "مالك الحساب" : "Account owner";
      return c.user_name;
    };

    const complaints = [
      ...(data.anonymousReports || []),
      ...(data.publicReports || []),
    ].filter((r) => inScope(r.stationId || defaultStationId));

    return buildDailyTimeline({
      targets: targets.filter((tg) => inScope(stationOf(tg))),
      complaints,
      day,
      stationOf,
      stationName,
      actorLabel,
      taskLabel: t("setTarget"),
      lang,
    });
  }, [targets, data, currentUser, day, lang, seesAll, stationOf]);

  if (!data || !currentUser) return null;

  const visible = activeStation === "all" ? timeline : timeline.filter((e) => e.stationKey === activeStation);

  // Reporting status per unit — reported, late, awaiting, or owing no report at all.
  const dueTime = data.reportDueTime || DEFAULT_REPORT_DUE_TIME;
  const units = buildUnitStatuses({
    stations: myStations,
    day,
    timeline,
    targets,
    schedules: data.schedules || [],
    stationOf,
    dueTime,
  });
  const lateUnits = units.filter((u) => u.status === "late").length;
  const canSetDueTime = seesAll || data.ownerId === currentUser.id;

  const dayTasks = visible.filter((e) => e.kind === "task");
  const doneTasks = dayTasks.filter((e) => e.status === "completed" || e.status === "approved").length;
  const openIssues = visible.filter((e) => e.kind === "issue" || e.kind === "complaint").filter((e) => !(e.responses || []).length).length;

  // The empty state explains why there is nothing here, per selected unit.
  const selectedUnit = activeStation === "all" ? null : units.find((u) => u.id === activeStation);
  const emptyStateText = selectedUnit
    ? selectedUnit.status === "idle"
      ? (lang === "ar"
          ? `${selectedUnit.name} — لا ورديات ولا مهام مستحقة اليوم، فلا تقرير مطلوب.`
          : `${selectedUnit.name} — no shifts and no tasks due today, so no report is required.`)
      : selectedUnit.status === "waiting"
        ? (lang === "ar" ? `${selectedUnit.name} — بانتظار الإرسال قبل ${dueTime}.` : `${selectedUnit.name} — awaiting the report, due at ${dueTime}.`)
        : (lang === "ar" ? `${selectedUnit.name} — متأخر عن إرسال تقرير اليوم.` : `${selectedUnit.name} — late on today's report.`)
    : units.every((u) => u.status === "idle")
      ? (lang === "ar" ? "لا ورديات ولا مهام مستحقة اليوم، فلا تقرير مطلوب." : "No shifts and no tasks due today, so no report is required.")
      : (lang === "ar" ? "لا يوجد نشاط مسجّل في هذا اليوم." : "No activity recorded on this day.");

  const stats = [
    { icon: ListTodo, label: lang === "ar" ? "مهام مكتملة" : "Tasks completed", value: `${doneTasks} ${lang === "ar" ? "من" : "of"} ${dayTasks.length}` },
    { icon: AlertTriangle, label: lang === "ar" ? "مشاكل مفتوحة" : "Open issues", value: openIssues },
    { icon: Send, label: lang === "ar" ? "وحدات متأخرة" : "Units late", value: lateUnits === 0 ? (lang === "ar" ? "لا وحدات متأخرة" : "None late") : lateUnits },
  ];

  return (
    <div className="reports-hub space-y-5">
      <PageHeader title={t("reports")} description={t("dailyReportNote")} icon={FileText} />

      <DayNavigator day={day} setDay={setDay} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <ReportCard key={s.label} className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <s.icon className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xl font-heading font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            </div>
          </ReportCard>
        ))}
      </div>

      <UnitSubmissionStrip
        units={units}
        activeStation={activeStation}
        setActiveStation={setActiveStation}
        dueTime={dueTime}
        onDueTimeChange={canSetDueTime && company ? (value) => updateCompany(company.id, (d) => { d.reportDueTime = value; }) : null}
      />

      {myStations.length > 1 && (
        <MobileSelect
          value={activeStation}
          onChange={setActiveStation}
          searchable
          placeholder={lang === "ar" ? "المحطة" : "Station"}
          className="w-full sm:w-64"
          options={[{ value: "all", label: lang === "ar" ? "كل المحطات" : "All stations" }, ...myStations.map((s) => ({ value: s.id, label: s.name }))]}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : visible.length === 0 ? (
        <ReportCard>
          <p className="text-sm text-muted-foreground font-body text-center py-6">
            {emptyStateText}
          </p>
        </ReportCard>
      ) : (
        <ReportCard>
          <div className="ps-3">
            {visible.map((entry) => (
              <TimelineEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </ReportCard>
      )}
    </div>
  );
}