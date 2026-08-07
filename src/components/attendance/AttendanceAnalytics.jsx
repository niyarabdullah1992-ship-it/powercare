import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { CalendarRange, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import MobileSelect from "@/components/mobile/MobileSelect";

const RANGES = ["monthly", "3months", "6months", "yearly", "custom"];

function EmployeeAxisTick({ x, y, payload, employees }) {
  const employee = employees.find((item) => item.employeeId === payload.value);
  return (
    <foreignObject x={x - 55} y={y + 4} width="110" height="28">
      <div className="text-center leading-tight">
        <EmployeeNameLink employeeId={employee?.employeeId} employeeName={employee?.name || "—"} className="block truncate text-[10px] font-body" />
      </div>
    </foreignObject>
  );
}

// Manager-only analytics: attendance rate and late frequency compared across the team.
export default function AttendanceAnalytics({ employees, t }) {
  const { lang } = useI18n();
  const [employeeId, setEmployeeId] = useState("all");
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const dateWindow = useMemo(() => {
    const end = range === "custom" && customEnd ? moment(customEnd) : moment();
    let start = moment().subtract(1, "month");
    if (range === "3months") start = moment().subtract(3, "months");
    if (range === "6months") start = moment().subtract(6, "months");
    if (range === "yearly") start = moment().subtract(1, "year");
    if (range === "custom" && customStart) start = moment(customStart);
    return { startDate: start.format("YYYY-MM-DD"), endDate: end.format("YYYY-MM-DD") };
  }, [range, customStart, customEnd]);

  useEffect(() => {
    const selected = employeeId === "all" ? employees : employees.filter((employee) => employee.id === employeeId);
    if (!selected.length) return;
    setLoading(true);
    Promise.all(selected.map((employee) => base44.functions.invoke("supabaseAttendance", {
      action: "listRange", employeeId: employee.id, ...dateWindow,
    }).then((res) => {
      const rows = res?.data?.rows || [];
      const summary = rows.reduce((total, row) => {
        if (row.status === "present") total.present++;
        if (row.status === "late") { row.excused ? total.excusedLate++ : total.late++; total.lateMinutesSum += Number(row.late_minutes) || 0; }
        if (row.status === "absent" && !row.excused) total.absent++;
        return total;
      }, { employeeId: employee.id, present: 0, late: 0, excusedLate: 0, absent: 0, lateMinutesSum: 0 });
      const worked = summary.present + summary.late + summary.excusedLate;
      const counted = worked + summary.absent;
      const lateEvents = summary.late + summary.excusedLate;
      return { ...summary, attendanceRate: counted ? Math.round((worked / counted) * 1000) / 10 : null, avgLateMinutes: lateEvents ? Math.round((summary.lateMinutesSum / lateEvents) * 10) / 10 : 0 };
    })))
      .then(setStats)
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, [employeeId, dateWindow.startDate, dateWindow.endDate, employees.map((e) => e.id).join(",")]);

  const nameOf = (id) => employees.find((e) => e.id === id)?.name || "—";
  const chartData = stats.map((s) => ({
    employeeId: s.employeeId,
    name: nameOf(s.employeeId),
    attendanceRate: s.attendanceRate ?? 0,
    lateCount: s.late + s.excusedLate,
    avgLateMinutes: s.avgLateMinutes,
  }));
  const avgRate = stats.length
    ? Math.round((stats.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / stats.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setReportOpen((value) => !value)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${reportOpen ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
      >
        <FileText className="w-3.5 h-3.5" /> {lang === "ar" ? "تقرير التحليلات (PDF / Excel)" : "Analytics report (PDF / Excel)"}
      </button>

      {reportOpen && <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CalendarRange className="w-3.5 h-3.5" /> {lang === "ar" ? "تقرير تحليلات الحضور" : "Attendance analytics report"}
        </p>
        <MobileSelect
          value={employeeId}
          onChange={setEmployeeId}
          placeholder={t("employeeName")}
          searchable
          className="w-full sm:w-72"
          options={[{ value: "all", label: lang === "ar" ? "كل الموظفين" : "All employees" }, ...employees.map((employee) => ({ value: employee.id, label: employee.name }))]}
        />
        <div className="flex flex-wrap gap-2">
          {RANGES.map((value) => (
            <button key={value} type="button" onClick={() => setRange(value)} className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${range === value ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
              {({ monthly: t("rangeMonthly"), "3months": t("range3Months"), "6months": t("preset6Months"), yearly: t("rangeYearly"), custom: t("rangeCustom") })[value]}
            </button>
          ))}
        </div>
        {range === "custom" && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
        </div>}
        <ComparisonExportButtons
          title={`${t("employeeComparisonLabel")} — ${dateWindow.startDate} → ${dateWindow.endDate}`}
          headers={[t("employeeName"), t("attendanceRateLabel"), t("lateFrequencyLabel"), t("avgLateMinutes")]}
          rows={chartData.map((r) => [r.name, `${r.attendanceRate}%`, r.lateCount, r.avgLateMinutes])}
          compact
        />
      </div>}

      <div className="p-5 rounded-xl border border-border bg-card space-y-5">
        <h3 className="font-heading text-lg font-semibold">{t("employeeComparisonLabel")}</h3>

      <div className="p-3 rounded-lg border border-border bg-muted inline-block">
        <p className="text-lg font-semibold">{avgRate}%</p>
        <p className="text-[11px] text-muted-foreground font-body">{t("avgAttendanceRate")}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAnalyticsDataAttendance")}</p>
      ) : (
        <>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("attendanceRateLabel")}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="employeeId" tick={(props) => <EmployeeAxisTick {...props} employees={chartData} />} height={42} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="attendanceRate" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("lateFrequencyLabel")}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="employeeId" tick={(props) => <EmployeeAxisTick {...props} employees={chartData} />} height={42} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="lateCount" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      </div>
    </div>
  );
}