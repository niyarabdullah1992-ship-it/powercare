import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/dateFormat";
import { visibleStations, canSeeAllStations, isCompanyOwner, visibleEmployees } from "@/lib/permissions";
import { HQ_STATION_ID } from "@/lib/store";
import { isOnApprovedLeave } from "@/lib/leaveTypes";
import moment from "moment";
import { FileText, ListTodo, AlertTriangle, Activity, Building2, Palette, UserCheck, UserX, CalendarDays } from "lucide-react";
import ReportCard from "@/components/reports/ReportCard";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";
import TaskStatusBadge from "@/components/reports/TaskStatusBadge";

export default function DailyReport() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [targets, setTargets] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBranding, setShowBranding] = useState(false);

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

  useEffect(() => {
    if (!currentUser || !data) return;
    const ids = visibleEmployees(currentUser, data).map((employee) => employee.id);
    if (!ids.length) { setAttendanceRows([]); return; }
    base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: ids })
      .then((res) => setAttendanceRows(res?.data?.rows || []))
      .catch(() => setAttendanceRows([]));
  }, [currentUser?.id, data?.employees?.length]);

  if (!data || !currentUser) return null;

  const seesAll = canSeeAllStations(currentUser);
  const myStations = visibleStations(currentUser, data);
  const stationIds = new Set(myStations.map((s) => s.id));

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || HQ_STATION_ID;

  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || null;
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || HQ_STATION_ID;
    if (tg.assignment_type === "hq_team") return HQ_STATION_ID;
    return tg.station_id || HQ_STATION_ID;
  };
  const stationLabel = (key) => (key === HQ_STATION_ID ? t("hq") : key ? stationName(key) : "—");
  const inScope = (key) => seesAll || stationIds.has(key);

  const isToday = (dateStr) => dateStr && moment(dateStr).isSame(moment(), "day");

  // Scope every target to the user's visible stations first.
  const myTargets = targets.filter((tg) => inScope(targetStationKey(tg)));

  // Today's tasks — created today or due today.
  const todaysTasks = myTargets
    .filter((tg) => isToday(tg.created_at) || isToday(tg.end_date))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Today's issues — stoppage issues logged today, plus anonymous/public complaints filed today.
  const todaysTaskIssues = [];
  myTargets.forEach((tg) => {
    (Array.isArray(tg.comments) ? tg.comments : []).forEach((c) => {
      if (c.is_issue && isToday(c.created_at)) {
        todaysTaskIssues.push({ ...c, targetTitle: tg.title || t("setTarget"), stationKey: targetStationKey(tg) });
      }
    });
  });
  const todaysComplaints = [
    ...(data.anonymousReports || []).map((r) => ({ ...r, kind: "anonymous" })),
    ...(data.publicReports || []).map((r) => ({ ...r, kind: "public" })),
  ].filter((r) => inScope(r.stationId || "hq") && isToday(r.createdAt));

  const totalIssuesToday = todaysTaskIssues.length + todaysComplaints.length;

  // Today's actions — every comment (progress note or issue) logged today across tasks.
  const todaysActions = [];
  myTargets.forEach((tg) => {
    (Array.isArray(tg.comments) ? tg.comments : []).forEach((c) => {
      if (isToday(c.created_at)) {
        todaysActions.push({ ...c, targetTitle: tg.title || t("setTarget"), stationKey: targetStationKey(tg) });
      }
    });
  });
  todaysActions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const attendanceEmployees = visibleEmployees(currentUser, data);
  const checkedInIds = new Set(attendanceRows.filter((row) => row.check_in_at).map((row) => row.employee_id));
  const onLeaveCount = attendanceEmployees.filter((employee) => !checkedInIds.has(employee.id) && isOnApprovedLeave(employee)).length;
  const attendanceStats = [
    { icon: UserCheck, label: t("totalPresent"), value: checkedInIds.size, tone: "emerald" },
    { icon: UserX, label: t("totalAbsent"), value: Math.max(0, attendanceEmployees.length - checkedInIds.size - onLeaveCount), tone: "red" },
    { icon: CalendarDays, label: t("onLeaveStatus"), value: onLeaveCount, tone: "violet" },
  ];
  const stats = [
    { icon: ListTodo, label: t("todayTasks"), value: todaysTasks.length },
    { icon: AlertTriangle, label: t("todayIssues"), value: totalIssuesToday },
    { icon: Activity, label: t("todayActions"), value: todaysActions.length },
  ];
  const canEditBranding = isCompanyOwner(currentUser, data) || currentUser.role === "director";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
            <FileText className="w-6 h-6" /> {t("reports")}
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{t("dailyReportNote")}</p>
        </div>
        {canEditBranding && (
          <button
            onClick={() => setShowBranding((value) => !value)}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-body hover:bg-muted"
          >
            <Palette className="h-3.5 w-3.5 text-accent" />
            {lang === "ar" ? "إعدادات الهوية" : "Brand settings"}
          </button>
        )}
      </div>

      {showBranding && canEditBranding && (
        <BrandingSettingsCard
          companyId={company.id}
          branding={data.reportBranding}
          companyName={data.name || company?.name || ""}
          lang={lang}
          onClose={() => setShowBranding(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {attendanceStats.map((s) => (
          <ReportCard key={s.label} className={`flex items-center gap-3 ${s.tone === "emerald" ? "border-emerald-200 bg-emerald-50" : s.tone === "red" ? "border-red-200 bg-red-50" : "border-violet-200 bg-violet-50"}`}>
            <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${s.tone === "emerald" ? "bg-emerald-100 text-emerald-700" : s.tone === "red" ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-700"}`}><s.icon className="w-4 h-4" /></span>
            <div><p className="text-2xl font-heading font-semibold">{s.value}</p><p className="text-xs text-muted-foreground font-body">{s.label}</p></div>
          </ReportCard>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <ReportCard key={s.label} className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <s.icon className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-2xl font-heading font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            </div>
          </ReportCard>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : (
        <>
          {/* Today's Tasks */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <ListTodo className="w-4 h-4" /> {t("todayTasks")}
            </h2>
            <ReportCard>
              {todaysTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-4">{t("noTasksInRange")}</p>
              ) : (
                <div className="space-y-2">
                  {todaysTasks.map((tg) => (
                    <div key={tg.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border/60">
                      <div className="min-w-0">
                        <p className="text-sm font-medium font-body truncate">{tg.title || t("setTarget")}</p>
                        <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {stationLabel(targetStationKey(tg))}
                        </p>
                      </div>
                      <TaskStatusBadge status={tg.status} t={t} />
                    </div>
                  ))}
                </div>
              )}
            </ReportCard>
          </section>

          {/* Today's Issues */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {t("todayIssues")}
            </h2>
            <ReportCard>
              {totalIssuesToday === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-4">{t("noIssuesReported")}</p>
              ) : (
                <div className="space-y-2">
                  {todaysTaskIssues.map((issue) => (
                    <div key={issue.id} className="p-3 rounded-lg border border-red-200 bg-red-50/60">
                      <div className="flex items-center justify-between gap-2 text-xs font-body text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {stationLabel(issue.stationKey)} · {issue.targetTitle}</span>
                        <span>{formatDateTime(issue.created_at, lang)}</span>
                      </div>
                      <p className="text-sm font-body mt-1">{issue.content}</p>
                    </div>
                  ))}
                  {todaysComplaints.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/60">
                      <div className="flex items-center justify-between gap-2 text-xs font-body text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {r.stationId ? stationName(r.stationId) : t("hq")} · {r.kind === "anonymous" ? t("anonymous") : t("publicComplaints")}
                        </span>
                        <span>{formatDateTime(r.createdAt, lang)}</span>
                      </div>
                      <p className="text-sm font-body mt-1">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </ReportCard>
          </section>

          {/* Today's Actions */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" /> {t("todayActions")}
            </h2>
            <ReportCard>
              {todaysActions.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-4">{t("noActionsToday")}</p>
              ) : (
                <div className="space-y-2">
                  {todaysActions.map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border border-border/60">
                      <div className="flex items-center justify-between gap-2 text-xs font-body text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {stationLabel(a.stationKey)} · {a.targetTitle} · {a.user_name}
                        </span>
                        <span>{formatDateTime(a.created_at, lang)}</span>
                      </div>
                      {a.content && <p className="text-sm font-body mt-1">{a.content}</p>}
                    </div>
                  ))}
                </div>
              )}
            </ReportCard>
          </section>
        </>
      )}
    </div>
  );
}