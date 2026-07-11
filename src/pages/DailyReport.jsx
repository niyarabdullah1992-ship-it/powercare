import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/dateFormat";
import { visibleStations, canSeeAllStations } from "@/lib/permissions";
import moment from "moment";
import { FileText, ListTodo, AlertTriangle, Activity, Building2, Check, Clock } from "lucide-react";

export default function DailyReport() {
  const { t, lang } = useI18n();
  const { data, currentUser } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || null;

  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || null;
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || null;
    if (tg.assignment_type === "hq_team") return "hq";
    return tg.station_id || null;
  };
  const stationLabel = (key) => (key === "hq" ? t("hq") : key ? stationName(key) : "—");
  const inScope = (key) => seesAll || key === "hq" ? true : stationIds.has(key);

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

  const statusBadge = (status) => ({
    completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
    overdue: "bg-red-100 text-red-700 border-red-300",
  }[status] || "bg-amber-100 text-amber-700 border-amber-300");

  const stats = [
    { icon: ListTodo, label: t("todayTasks"), value: todaysTasks.length },
    { icon: AlertTriangle, label: t("todayIssues"), value: totalIssuesToday },
    { icon: Activity, label: t("todayActions"), value: todaysActions.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
          <FileText className="w-6 h-6" /> {t("reports")}
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("dailyReportNote")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <s.icon className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-2xl font-heading font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            </div>
          </div>
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
            <div className="p-4 rounded-xl border border-border bg-card">
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap ${statusBadge(tg.status)}`}>
                        {tg.status === "completed" ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {tg.status === "completed" ? t("completed") : tg.status === "overdue" ? t("overdue") : t("inProgress")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Today's Issues */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {t("todayIssues")}
            </h2>
            <div className="p-4 rounded-xl border border-border bg-card">
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
            </div>
          </section>

          {/* Today's Actions */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" /> {t("todayActions")}
            </h2>
            <div className="p-4 rounded-xl border border-border bg-card">
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}