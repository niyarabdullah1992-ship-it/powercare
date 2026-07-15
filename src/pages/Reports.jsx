import React, { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { formatDate, formatDateTime } from "@/lib/dateFormat";
import { visibleStations, canSeeAllStations, isCompanyOwner } from "@/lib/permissions";
import moment from "moment";
import { FileBarChart2, Calendar, AlertTriangle, ListTodo, CalendarDays, FileSpreadsheet, UserSquare2, Printer } from "lucide-react";
import TaskStats from "@/components/tasks/TaskStats";
import { exportCSV } from "@/lib/exportReport";
import { printReport } from "@/lib/printReport";
import StationFilterDropdown from "@/components/reports/StationFilterDropdown";
import EmployeeReportTable from "@/components/reports/EmployeeReportTable";
import ReportCard from "@/components/reports/ReportCard";
import PageHeader from "@/components/PageHeader";
import ReportTableHead from "@/components/reports/ReportTableHead";
import TaskStatusBadge from "@/components/reports/TaskStatusBadge";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";
import ExportCenter from "@/components/reports/ExportCenter";
import HSESafetyReport from "@/components/reports/HSESafetyReport";
import { Palette, Download, ShieldCheck } from "lucide-react";

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
  const { data, currentUser, company } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [tab, setTab] = useState("tasks");
  const [selectedStations, setSelectedStations] = useState(null); // null = not initialized yet
  const [showBranding, setShowBranding] = useState(false);

  const seesAll = data && currentUser ? canSeeAllStations(currentUser) : false;
  const myStations = data && currentUser ? visibleStations(currentUser, data) : [];

  useEffect(() => {
    if (!data || !currentUser || selectedStations !== null) return;
    setSelectedStations([...myStations.map((s) => s.id), ...(seesAll ? ["hq"] : [])]);
  }, [data, currentUser]);

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

  const dateWindow = useMemo(() => {
    let start, end = moment();
    if (range === "custom") {
      start = customStart ? moment(customStart) : moment(0);
      end = customEnd ? moment(customEnd).endOf("day") : moment();
    } else {
      const cfg = RANGES.find((r) => r.val === range);
      start = moment().subtract(cfg.amount, cfg.unit);
    }
    return { start, end };
  }, [range, customStart, customEnd]);

  const inWindow = (dateStr) => {
    const m = moment(dateStr);
    return m.isSameOrAfter(dateWindow.start) && m.isSameOrBefore(dateWindow.end);
  };

  if (!data || !currentUser || selectedStations === null) return null;

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

  const priorityBadge = (p) => (p === "urgent" ? "bg-red-100 text-red-700 border-red-300" : "bg-muted text-muted-foreground border-border");

  const toggleStation = (key) => {
    setSelectedStations((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const filteredTasks = targets
    .filter((tg) => inWindow(tg.created_at))
    .filter((tg) => selectedStations.includes(targetStationKey(tg)))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredLeaves = data.employees
    .filter((e) => selectedStations.includes(e.stationId || "hq"))
    .flatMap((e) => (e.leaveRequests || []).map((r) => ({ ...r, employeeId: e.id })))
    .filter((r) => inWindow(r.createdAt))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const leaveStatusBadge = (status) => ({
    approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
    rejected: "bg-red-100 text-red-700 border-red-300",
  }[status] || "bg-amber-100 text-amber-700 border-amber-300");

  const tasksExportData = () => {
    const headers = [t("title"), t("station"), t("assignTo"), t("priority"), t("status"), t("taskCompletion"), t("stoppageIssues"), t("startDate"), t("endDate")];
    const rows = filteredTasks.map((tg) => [
      tg.title || "", stationLabel(tg), assignmentLabel(tg), t(tg.priority),
      tg.status === "completed" ? t("completed") : tg.status === "overdue" ? t("overdue") : t("inProgress"),
      `${tg.completed_tasks}/${tg.task_target}`, issueCount(tg), formatDate(tg.start_date, lang), formatDate(tg.end_date, lang),
    ]);
    return { headers, rows };
  };

  // Brand-styled printable report (save as PDF from the print dialog).
  const printTasksReport = () => {
    const { headers, rows } = tasksExportData();
    const completedCount = filteredTasks.filter((tg) => tg.status === "completed").length;
    const overdueCount = filteredTasks.filter((tg) => tg.status === "overdue").length;
    const activeCount = filteredTasks.filter((tg) => tg.status === "active").length;
    printReport({
      title: t("tasksReport"),
      companyName: data.name || company?.name || "",
      periodLabel: `${formatDate(dateWindow.start.toDate(), lang)} — ${formatDate(dateWindow.end.toDate(), lang)}`,
      dir,
      stats: [
        { label: t("total"), value: filteredTasks.length },
        { label: t("completed"), value: completedCount },
        { label: t("inProgress"), value: activeCount },
        { label: t("overdue"), value: overdueCount },
      ],
      sections: [{ heading: t("tasksReport"), headers, rows }],
      logoUrl: data.reportBranding?.logoUrl || "",
      color: data.reportBranding?.color || "#b07d3f",
    });
  };

  const isOwner = isCompanyOwner(currentUser, data);

  const TABS = [
    { key: "tasks", label: t("tasksReport"), icon: ListTodo },
    { key: "leaves", label: t("leaveRequests"), icon: CalendarDays },
    { key: "hse", label: lang === "ar" ? "السلامة (HSE)" : "Safety (HSE)", icon: ShieldCheck },
    ...(isOwner ? [{ key: "employeeReport", label: t("employeeReport"), icon: UserSquare2 }] : []),
    ...(isOwner || currentUser.role === "director" ? [{ key: "exportCenter", label: lang === "ar" ? "مركز التنزيل" : "Download Center", icon: Download }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("tasksReport")} description={t("tasksReportNote")} icon={FileBarChart2} />

      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
      {/* Section tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${tab === tb.key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            <tb.icon className="w-3.5 h-3.5" /> {tb.label}
          </button>
        ))}
      </div>

      {/* Station multi-select filter */}
      <StationFilterDropdown
        t={t}
        options={[...myStations.map((s) => ({ key: s.id, label: s.name })), ...(seesAll ? [{ key: "hq", label: t("hq") }] : [])]}
        selected={selectedStations}
        onToggle={toggleStation}
        onSelectAll={() => setSelectedStations([...myStations.map((s) => s.id), ...(seesAll ? ["hq"] : [])])}
        onClearAll={() => setSelectedStations([])}
      />

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

      </div>

      {/* Tasks tab */}
      {tab === "tasks" && (
        loading ? (
          <div className="space-y-3" aria-label={t("loading") || "Loading"}>
            {[1, 2, 3].map((item) => <div key={item} className="h-16 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <>
            {filteredTasks.length > 0 && <TaskStats targets={filteredTasks} t={t} />}
            {filteredTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={() => { const { headers, rows } = tasksExportData(); exportCSV(`tasks-report.csv`, headers, rows); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={printTasksReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                  <Printer className="w-3.5 h-3.5" /> PDF
                </button>
                {(isOwner || currentUser.role === "director") && (
                  <button onClick={() => setShowBranding((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                    <Palette className="w-3.5 h-3.5" style={{ color: data.reportBranding?.color || "#b07d3f" }} />
                    {lang === "ar" ? "هوية التقارير" : "Report branding"}
                  </button>
                )}
              </div>
            )}
            {showBranding && (isOwner || currentUser.role === "director") && (
              <BrandingSettingsCard
                companyId={company.id}
                branding={data.reportBranding}
                companyName={data.name || company?.name || ""}
                lang={lang}
                onClose={() => setShowBranding(false)}
              />
            )}
            <ReportCard>
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-6">{t("noTasksInRange")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-body mobile-cards">
                    <ReportTableHead columns={[t("title"), t("station"), t("assignTo"), t("priority"), t("status"), t("taskCompletion"), t("stoppageIssues"), t("startDate"), t("endDate")]} />
                    <tbody>
                      {filteredTasks.map((tg) => {
                        const pct = tg.task_target ? Math.min(Math.round((tg.completed_tasks / tg.task_target) * 100), 100) : 0;
                        const issues = issueCount(tg);
                        return (
                          <tr key={tg.id} className="border-b border-border/60 last:border-0">
                            <td data-label={t("title")} className="py-2.5 px-2 font-medium max-w-[180px] truncate">{tg.title || t("setTarget")}</td>
                            <td data-label={t("station")} className="py-2.5 px-2 text-muted-foreground">{stationLabel(tg)}</td>
                            <td data-label={t("assignTo")} className="py-2.5 px-2 text-muted-foreground">{assignmentLabel(tg)}</td>
                            <td data-label={t("priority")} className="py-2.5 px-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${priorityBadge(tg.priority)}`}>{t(tg.priority)}</span>
                            </td>
                            <td data-label={t("status")} className="py-2.5 px-2">
                              <TaskStatusBadge status={tg.status} t={t} />
                            </td>
                            <td data-label={t("taskCompletion")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{tg.completed_tasks}/{tg.task_target} ({pct}%)</td>
                            <td data-label={t("stoppageIssues")} className="py-2.5 px-2">
                              {issues > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 border border-red-300">
                                  <AlertTriangle className="w-2.5 h-2.5" /> {issues}
                                </span>
                              ) : "—"}
                            </td>
                            <td data-label={t("startDate")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{formatDate(tg.start_date, lang)}</td>
                            <td data-label={t("endDate")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{formatDate(tg.end_date, lang)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>
          </>
        )
      )}

      {/* Leaves tab */}
      {tab === "leaves" && (
        <ReportCard>
          {filteredLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body text-center py-6">{t("noLeaveRequests")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body mobile-cards">
                <ReportTableHead columns={[t("employeeName"), t("station"), t("leaveType"), t("startDate"), t("endDate"), t("days"), t("status")]} />
                <tbody>
                  {filteredLeaves.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td data-label={t("employeeName")} className="py-2.5 px-2 font-medium">{employeeName(r.employeeId)}</td>
                      <td data-label={t("station")} className="py-2.5 px-2 text-muted-foreground">{empStation(r.employeeId) ? stationName(empStation(r.employeeId)) : t("hq")}</td>
                      <td data-label={t("leaveType")} className="py-2.5 px-2 text-muted-foreground">{t(r.type)}</td>
                      <td data-label={t("startDate")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{formatDate(r.startDate, lang)}</td>
                      <td data-label={t("endDate")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{formatDate(r.endDate, lang)}</td>
                      <td data-label={t("days")} className="py-2.5 px-2 text-muted-foreground">{r.days}</td>
                      <td data-label={t("status")} className="py-2.5 px-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${leaveStatusBadge(r.status)}`}>{t(r.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>
      )}

      {/* HSE safety tab — monthly PDF per station + hours-without-incidents record */}
      {tab === "hse" && (
        <HSESafetyReport
          data={data}
          company={company}
          stations={myStations.filter((s) => selectedStations.includes(s.id))}
          canEdit={isOwner || ["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role)}
          lang={lang}
          dir={dir}
        />
      )}

      {/* Employee report tab — owner-only, free comparison across every employee aspect */}
      {tab === "employeeReport" && isOwner && (
        <EmployeeReportTable data={data} company={company} targets={targets} t={t} lang={lang} />
      )}

      {/* Download Center — every report across all sections, branded exports */}
      {tab === "exportCenter" && (isOwner || currentUser.role === "director") && (
        <ExportCenter targets={targets} />
      )}
    </div>
  );
}