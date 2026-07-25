import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/dateFormat";
import { visibleStations, canSeeAllStations, isCompanyOwner } from "@/lib/permissions";
import moment from "moment";
import { FileText, ListTodo, AlertTriangle, Activity, Building2, Palette } from "lucide-react";
import ReportCard from "@/components/reports/ReportCard";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";
import TaskStatusBadge from "@/components/reports/TaskStatusBadge";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import PageHeader from "@/components/PageHeader";

export default function DailyReport() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [targets, setTargets] = useState([]);
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

  if (!data || !currentUser) return null;

  const seesAll = canSeeAllStations(currentUser);
  const myStations = visibleStations(currentUser, data);
  const stationIds = new Set(myStations.map((s) => s.id));

  const defaultStationId = data.stations?.[0]?.id || null;
  const stationName = (id) => data.stations.find((s) => s.id === (id || defaultStationId))?.name || "—";
  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || defaultStationId;

  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || null;
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || defaultStationId;
    if (tg.assignment_type === "hq_team") return defaultStationId;
    return tg.station_id || defaultStationId;
  };
  const stationLabel = (key) => key ? stationName(key) : "—";
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
  ].filter((r) => inScope(r.stationId || defaultStationId) && isToday(r.createdAt));

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

  const stats = [
    { icon: ListTodo, label: t("todayTasks"), value: todaysTasks.length },
    { icon: AlertTriangle, label: t("todayIssues"), value: totalIssuesToday },
    { icon: Activity, label: t("todayActions"), value: todaysActions.length },
  ];
  const canEditBranding = isCompanyOwner(currentUser, data) || currentUser.role === "director";

  return (
    <div className="reports-hub space-y-6">
      <PageHeader
        title={t("reports")}
        description={t("dailyReportNote")}
        icon={FileText}
        actions={canEditBranding ? (
          <button
            onClick={() => setShowBranding((value) => !value)}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-accent/50 bg-primary-foreground/5 px-3 py-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Palette className="h-3.5 w-3.5 text-accent" />
            {lang === "ar" ? "إعدادات الهوية" : "Brand settings"}
          </button>
        ) : null}
      />

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
                          <Building2 className="w-3 h-3" /> {stationName(r.stationId || defaultStationId)} · {r.kind === "anonymous" ? t("anonymous") : t("publicComplaints")}
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
                          <Building2 className="w-3 h-3" /> {stationLabel(a.stationKey)} · {a.targetTitle} · <EmployeeNameLink employeeId={a.user_id} employeeName={a.user_name} />
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