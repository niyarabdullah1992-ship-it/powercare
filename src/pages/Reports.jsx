import React, { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { formatDate } from "@/lib/dateFormat";
import moment from "moment";
import { FileBarChart2, Calendar, AlertTriangle, Check, Clock } from "lucide-react";
import TaskStats from "@/components/tasks/TaskStats";

const RANGES = [
  { val: "daily", amount: 1, unit: "days" },
  { val: "weekly", amount: 7, unit: "days" },
  { val: "monthly", amount: 1, unit: "months" },
  { val: "6months", amount: 6, unit: "months" },
  { val: "yearly", amount: 1, unit: "years" },
  { val: "custom" },
];

export default function Reports() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

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

  const rangeLabel = (val) => ({
    daily: t("rangeDaily"),
    weekly: t("rangeWeekly"),
    monthly: t("rangeMonthly"),
    "6months": t("preset6Months"),
    yearly: t("rangeYearly"),
    custom: t("rangeCustom"),
  }[val] || val);

  const filtered = useMemo(() => {
    let start, end = moment();
    if (range === "custom") {
      start = customStart ? moment(customStart) : moment(0);
      end = customEnd ? moment(customEnd).endOf("day") : moment();
    } else {
      const cfg = RANGES.find((r) => r.val === range);
      start = moment().subtract(cfg.amount, cfg.unit);
    }
    return targets
      .filter((tg) => {
        const m = moment(tg.created_at);
        return m.isSameOrAfter(start) && m.isSameOrBefore(end);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [targets, range, customStart, customEnd]);

  if (!data || !currentUser) return null;

  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";
  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || null;

  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || null;
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || null;
    if (tg.assignment_type === "hq_team") return "hq";
    return tg.station_id || null;
  };

  const stationLabel = (tg) => {
    const key = targetStationKey(tg);
    if (key === "hq") return t("hq");
    return key ? stationName(key) : "—";
  };

  const assignmentLabel = (tg) => {
    if (tg.assignment_type === "member") return `${t("member")}: ${employeeName(tg.employee_id)}`;
    if (tg.assignment_type === "station_team") return t("stationTeam");
    if (tg.assignment_type === "hq_team") return t("hqTeam");
    return employeeName(tg.employee_id);
  };

  const issueCount = (tg) => (Array.isArray(tg.comments) ? tg.comments.filter((c) => c.is_issue).length : 0);

  const statusBadge = (status) => ({
    completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
    overdue: "bg-red-100 text-red-700 border-red-300",
  }[status] || "bg-amber-100 text-amber-700 border-amber-300");

  const priorityBadge = (p) => (p === "urgent" ? "bg-red-100 text-red-700 border-red-300" : "bg-muted text-muted-foreground border-border");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
          <FileBarChart2 className="w-6 h-6" /> {t("tasksReport")}
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("tasksReportNote")}</p>
      </div>

      {/* Range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {RANGES.map((r) => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${range === r.val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              {rangeLabel(r.val)}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-input text-xs font-body" />
            <span className="text-muted-foreground text-xs">—</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-input text-xs font-body" />
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : (
        <>
          {filtered.length > 0 && <TaskStats targets={filtered} t={t} />}

          <div className="p-5 rounded-xl border border-border bg-card">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-6">{t("noTasksInRange")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border text-start text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="py-2 px-2 text-start">{t("title")}</th>
                      <th className="py-2 px-2 text-start">{t("station")}</th>
                      <th className="py-2 px-2 text-start">{t("assignTo")}</th>
                      <th className="py-2 px-2 text-start">{t("priority")}</th>
                      <th className="py-2 px-2 text-start">{t("status")}</th>
                      <th className="py-2 px-2 text-start">{t("taskCompletion")}</th>
                      <th className="py-2 px-2 text-start">{t("stoppageIssues")}</th>
                      <th className="py-2 px-2 text-start">{t("startDate")}</th>
                      <th className="py-2 px-2 text-start">{t("endDate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tg) => {
                      const pct = tg.task_target ? Math.min(Math.round((tg.completed_tasks / tg.task_target) * 100), 100) : 0;
                      const issues = issueCount(tg);
                      return (
                        <tr key={tg.id} className="border-b border-border/60 last:border-0">
                          <td className="py-2.5 px-2 font-medium max-w-[180px] truncate">{tg.title || t("setTarget")}</td>
                          <td className="py-2.5 px-2 text-muted-foreground">{stationLabel(tg)}</td>
                          <td className="py-2.5 px-2 text-muted-foreground">{assignmentLabel(tg)}</td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${priorityBadge(tg.priority)}`}>{t(tg.priority)}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusBadge(tg.status)}`}>
                              {tg.status === "completed" ? <Check className="w-2.5 h-2.5" /> : tg.status === "overdue" ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                              {tg.status === "completed" ? t("completed") : tg.status === "overdue" ? t("overdue") : t("inProgress")}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{tg.completed_tasks}/{tg.task_target} ({pct}%)</td>
                          <td className="py-2.5 px-2">
                            {issues > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 border border-red-300">
                                <AlertTriangle className="w-2.5 h-2.5" /> {issues}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{formatDate(tg.start_date, lang)}</td>
                          <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{formatDate(tg.end_date, lang)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}